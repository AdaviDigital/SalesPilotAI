import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Every request carries the bearer token and the active organization id.
// The organization id is what the server's requireOrganization middleware
// uses to enforce tenant isolation — never trust a client-sent org id for
// data scoping beyond "which org is this session currently viewing".
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  const orgId = localStorage.getItem('activeOrganizationId');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (orgId) config.headers['X-Organization-Id'] = orgId;
  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log(
      '[API]',
      res.status,
      res.config.method?.toUpperCase(),
      res.config.url,
    );

    return res;
  },
  (error) => {
    console.error(
      '[API ERROR]',
      error.response?.status,
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error.response?.data,
    );

    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('activeOrganizationId');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);