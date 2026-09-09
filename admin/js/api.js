/**
 * WebsiteMo CMS — API Wrapper
 */
const API = {
  getToken() {
    return localStorage.getItem('cms_token');
  },

  getHeaders(isJSON = true) {
    const headers = {};
    if (isJSON) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = endpoint;
    const isJSON = !(options.body instanceof FormData);
    
    options.headers = {
      ...this.getHeaders(isJSON),
      ...(options.headers || {})
    };

    if (isJSON && options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        localStorage.removeItem('cms_token');
        localStorage.removeItem('cms_user');
        if (!window.location.pathname.endsWith('login.html')) {
          window.location.href = '/admin/login.html';
        }
        throw new Error('Session expired. Please log in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'An unexpected error occurred.');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  delete(endpoint, body = null) {
    return this.request(endpoint, { method: 'DELETE', body });
  }
};
