import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';

// Configure Axios globally so relative paths (e.g., axios.get('/api/...')) 
// are automatically routed to the Render backend instead of Vercel frontend
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);