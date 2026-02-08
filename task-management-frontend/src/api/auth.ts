import api from './client';

export const register = (email: string, password: string) =>
  api.post('/api/v1/auth/register', { email, password }).then((r) => r.data);

export const login = (email: string, password: string) =>
  api.post('/api/v1/auth/login', { email, password }).then((r) => r.data);

export const getMe = () => api.get('/me').then((r) => r.data);
