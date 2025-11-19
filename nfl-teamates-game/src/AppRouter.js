import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import App from './App';
import S3Dashboard from './S3Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import CloudIcon from '@mui/icons-material/Cloud';

function AppRouter() {
  return (
    <Router>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              NFL Teammates Game
            </Typography>
            <Button color="inherit" component={Link} to="/" startIcon={<HomeIcon />}>
              Game
            </Button>
            <Button color="inherit" component={Link} to="/admin/s3" startIcon={<CloudIcon />}>
              S3 Dashboard
            </Button>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin/s3" element={<S3Dashboard />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default AppRouter;
