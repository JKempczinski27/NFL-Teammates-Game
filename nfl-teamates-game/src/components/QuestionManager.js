import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';

export default function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    answer: '',
    difficulty: 'medium',
    category: '',
    players: []
  });
  const [playerImages, setPlayerImages] = useState([
    { src: '', name: '' },
    { src: '', name: '' },
    { src: '', name: '' }
  ]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        showSnackbar('Failed to fetch questions', 'error');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      showSnackbar('Error fetching questions', 'error');
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

  const handleOpenDialog = (question = null) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        answer: question.answer,
        difficulty: question.difficulty || 'medium',
        category: question.category || '',
        players: question.players || []
      });
      setPlayerImages(question.images || [
        { src: '', name: '' },
        { src: '', name: '' },
        { src: '', name: '' }
      ]);
    } else {
      setEditingQuestion(null);
      setFormData({
        answer: '',
        difficulty: 'medium',
        category: '',
        players: []
      });
      setPlayerImages([
        { src: '', name: '' },
        { src: '', name: '' },
        { src: '', name: '' }
      ]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingQuestion(null);
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handlePlayerImageChange = (index, field, value) => {
    const newPlayerImages = [...playerImages];
    newPlayerImages[index] = { ...newPlayerImages[index], [field]: value };
    setPlayerImages(newPlayerImages);
  };

  const addPlayerImage = () => {
    setPlayerImages([...playerImages, { src: '', name: '' }]);
  };

  const removePlayerImage = (index) => {
    if (playerImages.length > 2) {
      const newPlayerImages = playerImages.filter((_, i) => i !== index);
      setPlayerImages(newPlayerImages);
    } else {
      showSnackbar('Must have at least 2 player images', 'warning');
    }
  };

  const handleSaveQuestion = async () => {
    // Validate form
    if (!formData.answer.trim()) {
      showSnackbar('Answer is required', 'error');
      return;
    }

    // Validate that we have at least 2 players with images
    const validPlayers = playerImages.filter(p => p.src.trim() && p.name.trim());
    if (validPlayers.length < 2) {
      showSnackbar('At least 2 player images are required', 'error');
      return;
    }

    const questionData = {
      ...formData,
      images: validPlayers
    };

    try {
      const url = editingQuestion
        ? `/api/questions/${editingQuestion.id}`
        : '/api/questions';
      const method = editingQuestion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });

      if (response.ok) {
        showSnackbar(
          editingQuestion ? 'Question updated successfully' : 'Question created successfully',
          'success'
        );
        fetchQuestions();
        handleCloseDialog();
      } else {
        const error = await response.json();
        showSnackbar(error.message || 'Failed to save question', 'error');
      }
    } catch (error) {
      console.error('Error saving question:', error);
      showSnackbar('Error saving question', 'error');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSnackbar('Question deleted successfully', 'success');
        fetchQuestions();
      } else {
        showSnackbar('Failed to delete question', 'error');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      showSnackbar('Error deleting question', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Question Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Question
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading questions...</Typography>
      ) : questions.length === 0 ? (
        <Alert severity="info">
          No questions found. Click "Add New Question" to create your first question.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Answer</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Players</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>{question.id}</TableCell>
                  <TableCell>{question.answer}</TableCell>
                  <TableCell>
                    <Chip
                      label={question.difficulty || 'medium'}
                      color={
                        question.difficulty === 'easy' ? 'success' :
                        question.difficulty === 'hard' ? 'error' : 'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{question.category || 'N/A'}</TableCell>
                  <TableCell>
                    {question.images ? question.images.length : 0} players
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(question)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteQuestion(question.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Answer"
                  value={formData.answer}
                  onChange={(e) => handleFormChange('answer', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={formData.difficulty}
                    label="Difficulty"
                    onChange={(e) => handleFormChange('difficulty', e.target.value)}
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Category"
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  placeholder="e.g., Common Teammate"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Player Images
                </Typography>
                {playerImages.map((player, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={5}>
                        <TextField
                          fullWidth
                          label="Player Name"
                          value={player.name}
                          onChange={(e) => handlePlayerImageChange(index, 'name', e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Image URL"
                          value={player.src}
                          onChange={(e) => handlePlayerImageChange(index, 'src', e.target.value)}
                          size="small"
                          placeholder="https://..."
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton
                          color="error"
                          onClick={() => removePlayerImage(index)}
                          disabled={playerImages.length <= 2}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Card>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addPlayerImage}
                  fullWidth
                >
                  Add Another Player
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveQuestion} variant="contained">
            {editingQuestion ? 'Update' : 'Create'}
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
