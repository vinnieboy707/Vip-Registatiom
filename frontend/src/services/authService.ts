import api from './api';
import { User } from '../types';

export const authService = {
  async register(
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/register', {
      email,
      password,
      fullName,
      phone,
      role: 'agent',
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.user;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },
};
