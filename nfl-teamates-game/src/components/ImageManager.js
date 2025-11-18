import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Alert,
  Snackbar,
  Paper
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';

export default function ImageManager() {
  const [images, setImages] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [formData, setFormData] = useState({
    playerName: '',
    imageUrl: '',
    position: '',
    team: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      } else {
        showSnackbar('Failed to fetch images', 'error');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showSnackbar('Error fetching images', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (image = null) => {
    if (image) {
      setEditingImage(image);
      setFormData({
        playerName: image.player_name || '',
        imageUrl: image.image_url || '',
        position: image.position || '',
        team: image.team || ''
      });
    } else {
      setEditingImage(null);
      setFormData({
        playerName: '',
        imageUrl: '',
        position: '',
        team: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingImage(null);
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveImage = async () => {
    // Validate form
    if (!formData.playerName.trim()) {
      showSnackbar('Player name is required', 'error');
      return;
    }

    if (!formData.imageUrl.trim()) {
      showSnackbar('Image URL is required', 'error');
      return;
    }

    // Validate URL format
    try {
      new URL(formData.imageUrl);
    } catch (e) {
      showSnackbar('Please enter a valid URL', 'error');
      return;
    }

    const imageData = {
      player_name: formData.playerName,
      image_url: formData.imageUrl,
      position: formData.position,
      team: formData.team
    };

    try {
      const url = editingImage
        ? `/api/images/${editingImage.id}`
        : '/api/images';
      const method = editingImage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imageData)
      });

      if (response.ok) {
        showSnackbar(
          editingImage ? 'Image updated successfully' : 'Image added successfully',
          'success'
        );
        fetchImages();
        handleCloseDialog();
      } else {
        const error = await response.json();
        showSnackbar(error.message || 'Failed to save image', 'error');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      showSnackbar('Error saving image', 'error');
    }
  };

  const handleDeleteImage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSnackbar('Image deleted successfully', 'success');
        fetchImages();
      } else {
        showSnackbar('Failed to delete image', 'error');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showSnackbar('Error deleting image', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Image Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Image
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading images...</Typography>
      ) : images.length === 0 ? (
        <Alert severity="info">
          No images found. Click "Add New Image" to add your first player image.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {images.map((image) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={image.image_url}
                  alt={image.player_name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200?text=Image+Not+Found';
                  }}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {image.player_name}
                  </Typography>
                  {image.position && (
                    <Typography variant="body2" color="text.secondary">
                      Position: {image.position}
                    </Typography>
                  )}
                  {image.team && (
                    <Typography variant="body2" color="text.secondary">
                      Team: {image.team}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(image)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteImage(image.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingImage ? 'Edit Image' : 'Add New Image'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Player Name"
                  value={formData.playerName}
                  onChange={(e) => handleFormChange('playerName', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  value={formData.imageUrl}
                  onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                  required
                  placeholder="https://example.com/player-image.png"
                  helperText="Enter the full URL of the player's image"
                />
              </Grid>

              {formData.imageUrl && (
                <Grid item xs={12}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      bgcolor: '#f5f5f5'
                    }}
                  >
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: '200px' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x200?text=Invalid+URL';
                      }}
                    />
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Image preview
                  </Typography>
                </Grid>
              )}

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Position"
                  value={formData.position}
                  onChange={(e) => handleFormChange('position', e.target.value)}
                  placeholder="e.g., QB, WR, RB"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Team"
                  value={formData.team}
                  onChange={(e) => handleFormChange('team', e.target.value)}
                  placeholder="e.g., Patriots, Cowboys"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveImage} variant="contained">
            {editingImage ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
