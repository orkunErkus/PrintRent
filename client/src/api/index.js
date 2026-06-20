const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

async function request(endpoint, options = {}, timeout = 15000) {
  const url = `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      ...options,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Sunucu yanit vermedi, lutfen baglantiyi kontrol edin');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
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
    }, 30000),

  getStats: () => request('/stats'),

  getStatus: () => request('/status'),

  addPrinter: (data) =>
    request('/printers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePrinter: (id, data) =>
    request(`/printers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export default api;
