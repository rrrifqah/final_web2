import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const role = ref<string | null>(localStorage.getItem('role'));
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || '{}'));

  const isAuthenticated = computed(() => !!token.value);

  function login(newToken: string, newRole: string, newUser: any) {
    token.value = newToken;
    role.value = newRole;
    user.value = newUser;
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  function logout() {
    token.value = null;
    role.value = null;
    user.value = {};
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  }

  return {
    token,
    role,
    user,
    isAuthenticated,
    login,
    logout
  };
});
