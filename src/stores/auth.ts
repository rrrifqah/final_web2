import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/axios.js';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const role = ref<string | null>(localStorage.getItem('role'));
  const user = ref<any>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
  const isLoggedIn = ref<boolean>(!!token.value);

  const isAuthenticated = computed(() => !!token.value);

  function clearAuth() {
    token.value = null;
    role.value = null;
    user.value = null;
    isLoggedIn.value = false;
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('intended_url');
  }

  async function fetchUser() {
    if (!token.value) return null;
    try {
      const response = await api.get('/user');
      const userData = response.data.user || response.data;
      user.value = userData;
      role.value = userData.role;
      isLoggedIn.value = true;
      localStorage.setItem('role', userData.role);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      clearAuth();
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/login', { email, password, device_name: 'web' });
      const newToken = response.data.token || response.data.access_token;
      
      if (newToken) {
        token.value = newToken;
        isLoggedIn.value = true;
        localStorage.setItem('token', newToken);
      }

      await fetchUser();

      // Redirect based on role
      if (role.value === 'admin') {
        router.push('/admin/dashboard');
      } else if (role.value === 'kurir') {
        router.push('/courier/dashboard');
      } else {
        const intended = localStorage.getItem('intended_url');
        if (intended) {
          localStorage.removeItem('intended_url');
          router.push(intended);
        } else {
          router.push('/');
        }
      }

      return response.data;
    } catch (error) {
      clearAuth();
      throw error;
    }
  }

  async function register(name: string, email: string, phone: string, password: string) {
    try {
      const response = await api.post('/register', {
        name,
        email,
        phone,
        password,
        password_confirmation: password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout API failed, clearing local state anyway', error);
    } finally {
      clearAuth();
      router.push('/login');
    }
  }

  return {
    token,
    role,
    user,
    isLoggedIn,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    clearAuth
  };
});
