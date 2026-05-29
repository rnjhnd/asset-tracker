import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import './index.css'
import App from './App.tsx'

// Configure global retry logic for serverless database cold starts
axiosRetry(axios, { 
  retries: 3, 
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors (which happen during DB cold starts)
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 500 || error.response?.status === 503;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
