import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_NFL_API_BASE_URL, // Use REACT_APP_ prefix for Create React App
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_NFL_SECRET_ID}`,
  },
});

export default apiClient;