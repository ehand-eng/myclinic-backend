
export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
  window.location.href = '/';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('current_user');
  return user ? JSON.parse(user) : null;
};

// Custom auth functions for MongoDB-based authentication
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/custom-auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Store token and user data
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('current_user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  dispensaryIds?: string[];
}) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/custom-auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Store token and user data
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('current_user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/custom-auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }

    // Update stored user data
    localStorage.setItem('current_user', JSON.stringify(data));

    return data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    // Clear invalid token
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    throw error;
  }
};
