<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

function handleLogout() {
  authStore.logout();
  toastStore.trigger('LOGGED OUT SUCCESS', 'success');
  router.push('/auth');
}
</script>

<template>
  <div class="min-h-screen bg-[#F9F9F9] flex flex-col items-center">
    <!-- Centered mobile viewport layout constraint (max-width 480px) -->
    <div class="w-full max-w-[480px] bg-white min-h-screen border-l-4 border-r-4 border-black flex flex-col shadow-lg">
      <!-- Courier header -->
      <header class="sticky top-0 z-30 bg-white border-b-4 border-black p-4 flex justify-between items-center select-none">
        <div>
          <h1 class="text-xl font-extrabold uppercase tracking-tighter text-black">
            KETCE<span class="text-[#CC0000]">_COURIER</span>
          </h1>
          <p class="text-[10px] font-mono text-gray-500 uppercase mt-0.5">
            OPERATIVE: {{ authStore.user?.name || 'COURIER' }}
          </p>
        </div>
        
        <button
          @click="handleLogout"
          class="brutalist-button-red bg-[#CC0000] text-white hover:bg-black py-1 px-2.5 text-xs font-bold border-2 border-black active:scale-95 transition-all"
        >
          LOGOUT
        </button>
      </header>

      <!-- Main Slot Content -->
      <main class="flex-grow p-4 flex flex-col">
        <router-view />
      </main>
    </div>
  </div>
</template>
