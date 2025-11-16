import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

const S3Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFileKeys, setSelectedFileKeys] = useState([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('s3_admin_key') || '');
  const [folder, setFolder] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [uploadDialog, setUploadDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // API Configuration
  const API_BASE = process.env.REACT_APP_API_URL || '';

  const axiosConfig = {
    headers: {
      'x-api-key': apiKey,
    },
  };

  // Fetch files from S3
  const fetchFiles = async () => {
    if (!apiKey) {
      showSnackbar('Please enter your API key', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/s3/files`, axiosConfig);
      setFiles(response.data.files);
      showSnackbar('Files loaded successfully', 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bucket statistics
  const fetchStats = async () => {
    if (!apiKey) return;

    try {
      const response = await axios.get(`${API_BASE}/api/s3/stats`, axiosConfig);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Upload files to S3
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showSnackbar('Please select files to upload', 'warning');
      return;
    }

    setUploading(true);
    const formData = new FormData();

    if (selectedFiles.length === 1) {
      formData.append('file', selectedFiles[0]);
      if (folder) formData.append('folder', folder);

      try {
        await axios.post(`${API_BASE}/api/s3/upload`, formData, {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            'Content-Type': 'multipart/form-data',
          },
        });
        showSnackbar('File uploaded successfully', 'success');
        setUploadDialog(false);
        setSelectedFiles([]);
        setFolder('');
        fetchFiles();
        fetchStats();
      } catch (error) {
        showSnackbar(error.response?.data?.error || 'Failed to upload file', 'error');
      } finally {
        setUploading(false);
      }
    } else {
      Array.from(selectedFiles).forEach((file) => {
        formData.append('files', file);
      });
      if (folder) formData.append('folder', folder);

      try {
        await axios.post(`${API_BASE}/api/s3/upload-multiple`, formData, {
          ...axiosConfig,
          headers: {
            ...axiosConfig.headers,
            'Content-Type': 'multipart/form-data',
          },
        });
        showSnackbar(`${selectedFiles.length} files uploaded successfully`, 'success');
        setUploadDialog(false);
        setSelectedFiles([]);
        setFolder('');
        fetchFiles();
        fetchStats();
      } catch (error) {
        showSnackbar(error.response?.data?.error || 'Failed to upload files', 'error');
      } finally {
        setUploading(false);
      }
    }
  };

  // Delete a single file
  const handleDelete = async (key) => {
    try {
      await axios.delete(`${API_BASE}/api/s3/files/${encodeURIComponent(key)}`, axiosConfig);
      showSnackbar('File deleted successfully', 'success');
      setDeleteDialog(false);
      setFileToDelete(null);
      fetchFiles();
      fetchStats();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to delete file', 'error');
    }
  };

  // Delete multiple files
  const handleDeleteMultiple = async () => {
    if (selectedFileKeys.length === 0) {
      showSnackbar('No files selected', 'warning');
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/s3/delete-multiple`,
        { keys: selectedFileKeys },
        axiosConfig
      );
      showSnackbar(`${selectedFileKeys.length} files deleted successfully`, 'success');
      setSelectedFileKeys([]);
      fetchFiles();
      fetchStats();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to delete files', 'error');
    }
  };

  // Handle file selection for deletion
  const handleFileCheckbox = (key) => {
    setSelectedFileKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Save API key to localStorage
  const handleApiKeyChange = (e) => {
    const key = e.target.value;
    setApiKey(key);
    localStorage.setItem('s3_admin_key', key);
  };

  // Load data on mount
  useEffect(() => {
    if (apiKey) {
      fetchFiles();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          S3 Bucket Management Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your S3 bucket files, upload new files, and monitor storage statistics
        </Typography>
      </Box>

      {/* API Key Input */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <TextField
          fullWidth
          type="password"
          label="Admin API Key"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter your admin API key"
          helperText="Your API key is stored locally and required for all operations"
        />
      </Paper>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Files
                </Typography>
                <Typography variant="h4">{stats.totalFiles}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Size
                </Typography>
                <Typography variant="h4">{stats.totalSizeFormatted}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Bucket Name
                </Typography>
                <Typography variant="h6" sx={{ wordBreak: 'break-all' }}>
                  {stats.bucketName}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  File Types
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {Object.entries(stats.fileTypes || {})
                    .slice(0, 3)
                    .map(([ext, count]) => (
                      <Chip
                        key={ext}
                        label={`${ext}: ${count}`}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Actions */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => setUploadDialog(true)}
          disabled={!apiKey}
        >
          Upload Files
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchFiles();
            fetchStats();
          }}
          disabled={!apiKey || loading}
        >
          Refresh
        </Button>
        {selectedFileKeys.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteMultiple}
          >
            Delete Selected ({selectedFileKeys.length})
          </Button>
        )}
      </Box>

      {/* Files Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedFileKeys.length > 0 && selectedFileKeys.length < files.length
                  }
                  checked={files.length > 0 && selectedFileKeys.length === files.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFileKeys(files.map((f) => f.key));
                    } else {
                      setSelectedFileKeys([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell>File Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No files found. Upload some files to get started.
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.key}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedFileKeys.includes(file.key)}
                      onChange={() => handleFileCheckbox(file.key)}
                    />
                  </TableCell>
                  <TableCell>{file.key}</TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell>{new Date(file.lastModified).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => window.open(file.url, '_blank')}
                      title="Download/View"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setFileToDelete(file);
                        setDeleteDialog(true);
                      }}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Files to S3</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Folder (optional)"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g., images/players"
              sx={{ mb: 2 }}
              helperText="Leave empty to upload to root, or specify a folder path"
            />
            <Button variant="outlined" component="label" fullWidth>
              Select Files
              <input
                type="file"
                hidden
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              />
            </Button>
            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Selected files: {selectedFiles.length}
                </Typography>
                {selectedFiles.map((file, idx) => (
                  <Chip
                    key={idx}
                    label={`${file.name} (${formatBytes(file.size)})`}
                    sx={{ mr: 1, mb: 1 }}
                    onDelete={() => {
                      setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{fileToDelete?.key}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleDelete(fileToDelete.key)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default S3Dashboard;
