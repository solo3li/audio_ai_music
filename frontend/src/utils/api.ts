import axios from 'axios';

// Create an Axios instance with default configurations
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5208',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for sending and receiving cookies in CORS requests
});

// Add an interceptor for handling request/response globally (e.g., attach tokens)
api.interceptors.request.use((config) => {
  // You can add logic here to inject tokens dynamically if not using cookies
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  // Handle global errors, e.g., unauthorized or server errors
  if (error.response?.status === 401) {
    // Optionally trigger a logout action here
    console.warn('Unauthorized access, redirecting to login...');
  }
  return Promise.reject(error);
});

export default api;
