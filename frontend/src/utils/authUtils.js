import axios from 'axios';
// Member API methods
export const memberAPI = {
  // Get all members
  getMembers: () => api.get('/team'),

  // Create member (superadmin only)
  createMember: (memberData, isMultipart = false) => {
    if (isMultipart) {
      return api.post('/team', memberData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/team', memberData);
  },

  // Update member (admin/superadmin)
  updateMember: (id, memberData, isMultipart = false) => {
  if (isMultipart) {
    return api.put(`/team/${id}`, memberData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.put(`/team/${id}`, memberData);
},

  // Delete member (superadmin only)
  deleteMember: (id) => api.delete(`/team/${id}`)
};
// Admin API methods
export const adminAPI = {
  // Get all admins
  getAdmins: () => api.get('/admins'),

  // Create admin
  createAdmin: ({ username, password, role }) => api.post('/admins', { username, password, role }),

  // Update admin
  updateAdmin: (id, { username, password, role }) => api.put(`/admins/${id}`, { username, password, role }),

  // Delete admin (requires superadmin)
  deleteAdmin: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      if (tokenPayload.role !== 'superadmin') {
        throw new Error('Insufficient permissions. Superadmin role required.');
      }
      const response = await api.delete(`/admins/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Promote admin to superadmin
  promoteToSuperAdmin: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      if (tokenPayload.role !== 'superadmin') {
        throw new Error('Insufficient permissions. Superadmin role required.');
      }
      const response = await api.put(`/admins/${id}`, { role: 'superadmin' });
      return response;
    } catch (error) {
      throw error;
    }
  }
};
// Article API methods
export const articleAPI = {
  // Get all articles
  getArticles: () => api.get('/articles'),

  // Get single article
  getArticle: (id) => api.get(`/articles/${id}`),

  // Create article
  createArticle: (articleData) => api.post('/articles', articleData),

  // Update article
  updateArticle: (id, articleData) => api.put(`/articles/${id}`, articleData),

  // Delete article (requires superadmin)
  deleteArticle: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      // Decode token to check role (optional verification)
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      if (tokenPayload.role !== 'superadmin' && tokenPayload.role !== 'admin') {
        throw new Error('Insufficient permissions. Admin or Superadmin role required.');
      }
      const response = await api.delete(`/articles/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};
// Event API methods
export const eventAPI = {
  // Get all events
  getEvents: () => api.get('/events'),

  // Get single event
  getEvent: (id) => api.get(`/events/${id}`),

  // Create event (supports multipart)
  createEvent: (eventData, isMultipart = false) => {
    if (isMultipart) {
      return api.post('/events', eventData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/events', eventData);
  },

  // Update event
  updateEvent: (id, eventData, isFormData = false) => {
    if (isFormData) {
      return api.put(`/events/${id}`, eventData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.put(`/events/${id}`, eventData);
  },

  // Delete event (requires superadmin)
  deleteEvent: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      // Decode token to check role (optional verification)
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      if (tokenPayload.role !== 'superadmin' && tokenPayload.role !== 'admin') {
        throw new Error('Insufficient permissions. Admin or Superadmin role required.');
      }
      const response = await api.delete(`/events/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};
// Service API methods
export const serviceAPI = {
  // Get all services
  getServices: () => api.get('/services'),

  // Get single service
  getService: (id) => api.get(`/services/${id}`),

  // Create service
  createService: (serviceData) => api.post('/services', serviceData),

  // Update service
  updateService: (id, serviceData) => api.put(`/services/${id}`, serviceData),

  // Delete service (requires superadmin)
  deleteService: async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      // Decode token to check role (optional verification)
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      if (tokenPayload.role !== 'superadmin' && tokenPayload.role !== 'admin') {
        throw new Error('Insufficient permissions. Admin or Superadmin role required.');
      }
      const response = await api.delete(`/services/${id}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};
// Frontend: services/api.js

// Create axios instance with base configuration
const api = axios.create({
  baseURL: (process.env.REACT_APP_API_BASE_URL || 'https://venturepoint-backend.onrender.com') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
  window.location.href = '/admin/login';
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

  // Create project (supports multipart)
  createProject: (projectData, isMultipart = false) => {
    if (isMultipart) {
      return api.post('/projects', projectData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/projects', projectData);
  },

  // Update project (supports multipart)
  updateProject: (id, projectData, isMultipart = false) => {
    if (isMultipart) {
      return api.put(`/projects/${id}`, projectData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.put(`/projects/${id}`, projectData);
  },
  
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
      
      if (tokenPayload.role !== 'superadmin' && tokenPayload.role !== 'admin') {
        throw new Error('Insufficient permissions. Admin or Superadmin role required.');
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
  // Proactive auto-logout based on JWT expiration
  scheduleAutoLogout: () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return;
      const expMs = payload.exp * 1000;
      const nowMs = Date.now();
      const timeoutMs = expMs - nowMs;
      const showTimeoutMessage = () => {
        // You can replace alert with a custom modal if desired
        alert('Session timed out. Please login again.');
        authAPI.logout();
      };
      if (timeoutMs > 0) {
        setTimeout(showTimeoutMessage, timeoutMs);
      } else {
        showTimeoutMessage();
      }
    } catch (e) {
      // If token is invalid, logout immediately
      alert('Session timed out. Please login again.');
      authAPI.logout();
    }
  },
  login: (credentials) => api.post('/admin/login', credentials),
  register: (userData) => api.post('/admin/register', userData),
  logout: () => {
    localStorage.removeItem('token');
  window.location.href = '/admin/login';
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