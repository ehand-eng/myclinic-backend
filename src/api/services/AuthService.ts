
import axios from 'axios';
import { User, UserRole } from '../models';
import { API_URL } from '../../config';
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  name: string;
  phone?: string;
}

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);

      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);

        // Set default role if not provided
        if (!response.data.user.role) {
          response.data.user.role = UserRole.HOSPITAL_ADMIN;
        }
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async signup(userData: SignupData): Promise<{ user: User; token: string }> {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, userData);

      // Store token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);

        // Set default role if not provided
        if (!response.data.user.role) {
          response.data.user.role = UserRole.HOSPITAL_ADMIN;
        }
      }

      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  logout(): void {
    localStorage.removeItem('auth_token');
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
