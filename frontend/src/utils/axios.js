import axios from 'axios';

// Function to determine the base URL
function getBaseUrl() {
  // If we're running through ngrok
  if (window.location.hostname.includes('ngrok') || window.location.hostname !== 'localhost') {
    // Extract the base URL from the current page URL (protocol + hostname)
    const baseUrl = `${window.location.protocol}//${window.location.hostname}`;
    
    // If we're on a non-standard port, include it
    const port = window.location.port ? `:${window.location.port}` : '';
    
    return `${baseUrl}${port}/api`;
  }
  
  // Default to localhost for local development
  return 'http://localhost:5000/api';
}

// Create axios instance with dynamic base URL
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Keep credentials mode for authentication cookies
  withCredentials: true,
  // Increase timeout to prevent hanging requests on slower connections or API calls
  timeout: 30000
});

// Log configuration in development
if (process.env.NODE_ENV !== 'production') {
  console.log('API base URL:', getBaseUrl());
}

// Add a request interceptor to add the JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration and other errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log network errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ API Error:', error.message, originalRequest?.url);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.code === 'ECONNABORTED') {
        console.error('Request timeout! The server is taking too long to respond.');
      } else if (error.request) {
        console.error('No response received. The server might be down or unreachable.');
      }
    }
    
    // Handle 401 Unauthorized error - attempt token refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token available, clear auth and redirect
        localStorage.removeItem('token');
        console.error('Authentication failed. Redirecting to login page.');
        window.location.href = '/';
        return Promise.reject(error);
      }
      
      try {
        const response = await api.post(`/auth/refresh-token`, {
          refreshToken
        });
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          
          // Update authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
          
          // Process queued requests
          processQueue(null, response.data.token);
          
          return api(originalRequest); // Retry the original request
        } else {
          processQueue(error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        console.error('Token refresh failed. Redirecting to login page.');
        window.location.href = '/';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    if (error.response) {
      // Handle different error status codes
      switch (error.response.status) {
        case 403:
          // Authorization error
          console.error('Access forbidden:', error.response.data?.message || 'You do not have permission to access this resource');
          break;
          
        case 404:
          // Resource not found
          console.error('Resource not found:', originalRequest?.url);
          break;
          
        case 500:
          // Server error
          console.error('Server error. Please try again later.', error.response.data?.message || '');
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      // Handle timeout errors specifically
      console.error(`Request timeout (${originalRequest?.timeout}ms). The server or an external service is taking too long to respond.`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. Check your network connection and server status.');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 