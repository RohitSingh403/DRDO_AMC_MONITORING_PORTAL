import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject({
        message: error.response.data?.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject({
        message: 'No response from server. Please check your connection.',
        status: 0,
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject({
        message: error.message || 'An error occurred',
        status: -1,
      });
    }
  }
);

// API methods
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
};

export const tasksAPI = {
  getAll: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },
  
  getByCategory: async (category) => {
    const response = await api.get(`/tasks/${category}`);
    return response.data;
  },
  
  getUserTasks: async (userId) => {
    const response = await api.get(`/api/user-tasks/${userId}`);
    return response.data;
  },
  
  updateStatus: async (taskId, status) => {
    const response = await api.put(`/tasks/${taskId}/status`, { status });
    return response.data;
  },
};

export const equipmentAPI = {
  getAll: async () => {
    const response = await api.get('/equipment');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/equipment/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/equipment', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/equipment/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/equipment/${id}`);
    return response.data;
  },
};

export const logsAPI = {
  getAll: async () => {
    const response = await api.get('/logs');
    return response.data;
  },
  
  create: async (logData) => {
    const response = await api.post('/logs', logData);
    return response.data;
  },
};

export default api;
