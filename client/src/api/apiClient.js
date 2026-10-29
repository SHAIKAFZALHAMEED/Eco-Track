const BASE_URL = '/api';

export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.error?.message || `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Dashboard
  getDashboard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/dashboard${q ? `?${q}` : ''}`);
  },

  // Buildings
  getBuildings: () => request('/buildings'),
  createBuilding: (data) => request('/buildings', { method: 'POST', body: JSON.stringify(data) }),
  updateBuilding: (id, data) => request(`/buildings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBuilding: (id) => request(`/buildings/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),

  // Factors
  getFactors: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/factors${q ? `?${q}` : ''}`);
  },
  createFactor: (data) => request('/factors', { method: 'POST', body: JSON.stringify(data) }),
  updateFactor: (id, data) => request(`/factors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleFactorStatus: (id, is_active) => request(`/factors/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  deleteFactor: (id) => request(`/factors/${id}`, { method: 'DELETE' }),

  // Records
  getRecords: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/records${q ? `?${q}` : ''}`);
  },
  createRecord: (data) => request('/records', { method: 'POST', body: JSON.stringify(data) }),
  updateRecord: (id, data) => request(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecord: (id) => request(`/records/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports${q ? `?${q}` : ''}`);
  },
  getReportExportUrl: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return `${BASE_URL}/reports/export${q ? `?${q}` : ''}`;
  }
};

