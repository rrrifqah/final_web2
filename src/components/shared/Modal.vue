<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  show: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// Prevent body scroll when modal is active
onMounted(() => {
  if (props.show) {
    document.body.style.overflow = 'hidden';
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-black/60 cursor-pointer" @click="emit('close')"></div>
        
        <!-- Dialog Content -->
        <div class="relative w-full max-w-lg bg-white border-4 border-black p-6 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-10 overflow-y-auto max-h-[90vh]">
          <!-- Header -->
          <div class="flex justify-between items-center border-b-4 border-black pb-3 mb-4">
            <h3 class="text-xl font-bold uppercase tracking-tighter text-black">
              {{ title || 'DIALOG_BOX' }}
            </h3>
            <button 
              @click="emit('close')" 
              class="w-8 h-8 flex items-center justify-center border-2 border-black font-extrabold hover:bg-[#CC0000] hover:text-white transition-all active:scale-95"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          
          <!-- Content Slot -->
          <div class="text-black text-sm">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
