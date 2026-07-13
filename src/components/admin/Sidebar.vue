<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const menuItems = [
  { path: '/admin/dashboard', label: 'DASHBOARD' },
  { path: '/admin/products', label: 'SKU_REGISTRY' },
  { path: '/admin/orders', label: 'DEPLOYMENTS' },
  { path: '/admin/couriers', label: 'FLEET_STATUS' },
];

function handleLogout() {
  authStore.logout();
  toastStore.trigger('LOGGED OUT SUCCESS', 'success');
  router.push('/auth');
}
</script>

<template>
  <aside class="fixed top-0 left-0 bottom-0 w-60 bg-black text-white flex flex-col z-40 border-r-4 border-black">
    <!-- Logo -->
    <div class="p-6 border-b-4 border-[#333333] select-none text-center">
      <h1 class="text-3xl font-extrabold uppercase tracking-tighter">
        KETCE<span class="text-[#CC0000]">_SYS</span>
      </h1>
    </div>

    <!-- Navigation -->
    <nav class="flex-grow p-4 flex flex-col gap-2">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'block font-bold uppercase tracking-tight p-3 rounded-none transition-all duration-150 border-2 border-transparent hover:bg-gray-800 hover:border-white text-sm',
          route.path === item.path ? 'bg-[#CC0000] text-white border-white' : 'text-gray-300'
        ]"
      >
        {{ item.label }}
      </router-link>
    </nav>

    <!-- Logout -->
    <div class="p-4 border-t-4 border-[#333333]">
      <div class="mb-4 px-2">
        <p class="text-xs text-gray-500 font-mono">OPERATOR:</p>
        <p class="text-sm font-bold truncate uppercase">{{ authStore.user?.name || 'ADMIN' }}</p>
      </div>
      <button
        @click="handleLogout"
        class="w-full text-center brutalist-button-red bg-[#CC0000] hover:bg-white hover:text-black py-2.5 text-xs font-bold border-2 border-white active:scale-95 transition-all text-white"
      >
        SHUTDOWN_LOGOUT
      </button>
    </div>
  </aside>
</template>
