const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  getPrinters: (search) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/printers${params}`);
  },

  getPrinter: (id) => request(`/printers/${id}`),

  deletePrinter: (id) => request(`/printers/${id}`, { method: 'DELETE' }),

  getPrinterHistory: (id, limit = 50) =>
    request(`/printers/${id}/history?limit=${limit}`),

  scanNetwork: (range) =>
    request('/scan', {
      method: 'POST',
      body: JSON.stringify({ range }),
    }),

  scanSingle: (ip) =>
    request('/scan/single', {
      method: 'POST',
      body: JSON.stringify({ ip }),
    }),

  getScanProgress: () => request('/scan/progress'),

  testConnection: (ip) =>
    request('/test-connection', {
      method: 'POST',
      body: JSON.stringify({ ip }),
    }),

  getStats: () => request('/stats'),

  getStatus: () => request('/status'),
};

export default api;
