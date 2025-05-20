import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8000',
});

// Add a request interceptor to include the token in all requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle session expiration
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
      // Handle forbidden access
      if (error.response.status === 403) {
        return Promise.reject(new Error('You do not have permission to perform this action.'));
      }
      // Handle server errors
      if (error.response.status >= 500) {
        return Promise.reject(new Error('Server error. Please try again later.'));
      }
    } else if (error.request) {
      // Network error
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    return Promise.reject(error);
  }
);

export default instance;
