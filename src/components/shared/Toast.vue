<script setup lang="ts">
import { useToastStore } from '@/stores/toast';

const toastStore = useToastStore();
</script>

<template>
  <Transition name="toast-slide">
    <div 
      v-if="toastStore.show"
      :class="[
        'fixed bottom-6 right-6 z-50 px-6 py-4 border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between min-w-[300px]',
        toastStore.type === 'success' ? 'bg-[#00CC66] text-black font-bold' : 'bg-[#CC0000] text-white font-bold'
      ]"
    >
      <div class="flex items-center gap-3">
        <span class="text-xl font-mono" v-if="toastStore.type === 'success'">✓</span>
        <span class="text-xl font-mono" v-else>✕</span>
        <span class="uppercase tracking-wide text-sm font-bold">{{ toastStore.message }}</span>
      </div>
      <button 
        @click="toastStore.show = false" 
        class="ml-4 font-mono font-bold hover:opacity-75"
      >
        ✕
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;
}

.toast-slide-enter-from {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}
</style>
