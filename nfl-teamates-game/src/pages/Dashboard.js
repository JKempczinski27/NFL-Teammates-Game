import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  AppBar,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import QuestionManager from '../components/QuestionManager';
import ImageManager from '../components/ImageManager';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          <Typography variant="h6" sx={{ py: 2 }}>
            NFL Teammates Game - Admin Dashboard
          </Typography>
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ ml: 'auto' }}
          >
            Back to Game
          </Button>
        </Box>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab label="Question Management" id="tab-0" aria-controls="tabpanel-0" />
            <Tab label="Image Management" id="tab-1" aria-controls="tabpanel-1" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <QuestionManager />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ImageManager />
        </TabPanel>
      </Container>
    </Box>
  );
}
