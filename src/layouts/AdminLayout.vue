<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sidebar from '@/components/admin/Sidebar.vue';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const pageTitle = computed(() => {
  return (route.meta.title as string) || 'OPERATIONS CENTER';
});

function handleLogout() {
  authStore.logout();
  toastStore.trigger('LOGGED OUT SUCCESS', 'success');
  router.push('/auth');
}
</script>

<template>
  <div class="min-h-screen bg-[#F9F9F9]">
    <!-- Admin Sidebar -->
    <Sidebar />

    <!-- Right Side Container -->
    <div class="ml-60 flex flex-col min-h-screen">
      <!-- Sticky Top Header -->
      <header class="sticky top-0 z-30 h-16 bg-white border-b-4 border-black flex items-center justify-between px-6 select-none">
        <!-- Route Title -->
        <h2 class="text-2xl font-black uppercase tracking-tighter text-black">
          {{ pageTitle }}
        </h2>

        <!-- Right Controls -->
        <div class="flex items-center gap-4">
          <div class="text-right font-mono text-xs hidden sm:block">
            <span class="text-gray-400 uppercase">role:</span>
            <span class="font-bold text-black uppercase ml-1">{{ authStore.role }}</span>
          </div>
          <div class="border-l-2 border-black h-6 hidden sm:block"></div>
          <span class="font-bold text-sm uppercase text-black">
            {{ authStore.user?.name || 'ADMIN' }}
          </span>
          <button
            @click="handleLogout"
            class="brutalist-button-red bg-[#CC0000] text-white hover:bg-black py-1 px-3 text-xs font-bold border-2 border-black active:scale-95 transition-all"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <!-- Main Layout Body -->
      <main class="flex-grow p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
