const API_BASE_URL = 'http://localhost:5000/api';

// Helper to make API requests with JWT authorization header automatically injected
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { error: 'Invalid JSON response from server' };
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    login: (email, password) => apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
    register: (email, password, role) => apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    }),
  },
  drivers: {
    list: () => apiRequest('/drivers'),
    get: (id) => apiRequest(`/drivers/${id}`),
    create: (data) => apiRequest('/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => apiRequest(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id) => apiRequest(`/drivers/${id}`, {
      method: 'DELETE',
    }),
  },
  trips: {
    list: () => apiRequest('/trips'),
    create: (data) => apiRequest('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    dispatch: (id) => apiRequest(`/trips/${id}/dispatch`, {
      method: 'POST',
    }),
    complete: (id, data) => apiRequest(`/trips/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    cancel: (id) => apiRequest(`/trips/${id}/cancel`, {
      method: 'POST',
    }),
  },
  vehicles: {
    list: () => apiRequest('/vehicles'),
    create: (data) => apiRequest('/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  analytics: {
    dashboard: (filters = {}) => {
      const params = new URLSearchParams(filters).toString();
      return apiRequest(`/analytics/dashboard${params ? '?' + params : ''}`);
    },
    reports: () => apiRequest('/analytics/reports'),
  },
};
