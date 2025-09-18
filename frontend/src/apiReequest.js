// Frontend: services/api.js
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: (process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Request interceptor to add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Add Bearer prefix to token
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Sending request with token:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Project API methods
export const projectAPI = {
  // Get all projects
  getProjects: () => api.get('/projects'),
  
  // Get single project
  getProject: (id) => api.get(`/projects/${id}`),
  
  // Create project
  createProject: (projectData) => api.post('/projects', projectData),
  
  // Update project
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  
  // Delete project (requires superadmin)
  deleteProject: async (id) => {
    try {
      console.log(`Attempting to delete project ${id}`);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Decode token to check role (optional verification)
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', tokenPayload);
      console.log('User role:', tokenPayload.role);
      
      if (tokenPayload.role !== 'superadmin') {
        throw new Error('Insufficient permissions. Superadmin role required.');
      }
      
      const response = await api.delete(`/projects/${id}`);
      console.log('Delete successful:', response.data);
      return response;
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }
};

// Auth API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
  
  // Get current user info
  getCurrentUser: () => api.get('/auth/me'),
  
  // Check if user has required role
  hasRole: (requiredRole) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role === requiredRole;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
  }
};

export default api;