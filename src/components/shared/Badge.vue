<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const badgeClasses = computed(() => {
  const s = props.status?.toLowerCase() || '';
  
  if (['pending'].includes(s)) {
    return 'bg-white text-black border-black border-4';
  }
  
  if (['paid', 'confirmed', 'packed', 'delivered', 'selesai'].includes(s)) {
    return 'bg-black text-white border-black border-4';
  }
  
  if (['failed', 'cancelled', 'batal', 'delivering', 'picked_up', 'sedang dikirim', 'sudah sampai'].includes(s)) {
    return 'bg-[#CC0000] text-white border-black border-4';
  }
  
  // Default fallback
  return 'bg-gray-200 text-black border-black border-4';
});
</script>

<template>
  <span :class="['inline-block font-mono font-bold px-3 py-1 uppercase tracking-wider text-xs rounded-none transition-all duration-150', badgeClasses]">
    {{ status }}
  </span>
</template>
