import api from './base';
import { User, LoginRequest, RegisterRequest } from '../types';

export const login = async (data: LoginRequest) => {
  const response = await api.post('/api/v1/auth/login', data);
  return response.data;
};

export const register = async (data: RegisterRequest) => {
  const response = await api.post('/api/v1/auth/register', data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/api/v1/auth/me');
  return response.data;
};
