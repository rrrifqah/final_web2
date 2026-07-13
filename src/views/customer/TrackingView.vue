<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/axios.js';
import Badge from '@/components/shared/Badge.vue';

interface Courier {
  name: string;
  phone: string;
  vehicle_type: string;
}

interface DeliveryLog {
  timestamp: string;
  description: string;
}

interface TrackingData {
  status: string;
  order_code: string;
  courier: Courier | null;
  logs: DeliveryLog[];
}

const route = useRoute();
const router = useRouter();
const orderCode = computed(() => (route.params.orderCode || route.params.code) as string);

const trackingData = ref<TrackingData | null>(null);
const isLoading = ref(false);
let refreshInterval: number | null = null;

onMounted(() => {
  fetchTracking();
  // Auto refresh every 30 seconds
  refreshInterval = window.setInterval(() => {
    fetchTracking(true); // silent fetch
  }, 30000);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});

async function fetchTracking(silent = false) {
  if (!silent) isLoading.value = true;
  try {
    const res = await api.get(`/api/orders/${orderCode.value}/tracking`);
    trackingData.value = res.data;
  } catch (err) {
    console.error('Failed to fetch tracking data:', err);
    // Simulating tracking data for local testing
    if (!trackingData.value) {
      trackingData.value = {
        order_code: orderCode.value || 'KT-9928314',
        status: 'delivering', // Simulated current status
        courier: {
          name: 'Budi Santoso',
          phone: '081299881122',
          vehicle_type: 'E-BIKE'
        },
        logs: [
          { timestamp: '2026-06-07 10:15:30', description: 'PAKET SEDANG DIANTAR OLEH KURIR' },
          { timestamp: '2026-06-07 08:30:00', description: 'PAKET DIASIGN KE KURIR BUDI SANTOSO' },
          { timestamp: '2026-06-06 15:44:12', description: 'PEMBAYARAN DIVERIFIKASI, PESANAN DIKEMAS' },
          { timestamp: '2026-06-06 14:02:50', description: 'PESANAN BERHASIL DIBUAT' }
        ]
      };
    }
  } finally {
    isLoading.value = false;
  }
}

// Progress Steps
const steps = ['DIPESAN', 'DIKEMAS', 'SEDANG DIKIRIM', 'SUDAH SAMPAI'];

const currentStepIndex = computed(() => {
  if (!trackingData.value) return 0;
  const status = trackingData.value.status.toLowerCase();
  
  if (['pending'].includes(status)) return 0;
  if (['paid', 'confirmed', 'packed'].includes(status)) return 1;
  if (['delivering', 'picked_up', 'sedang dikirim'].includes(status)) return 2;
  if (['delivered', 'selesai', 'sudah sampai'].includes(status)) return 3;
  return 0;
});

function getStepClass(index: number) {
  const currentIndex = currentStepIndex.value;
  if (index < currentIndex) {
    // Completed step
    return 'bg-black text-white border-black';
  } else if (index === currentIndex) {
    // Current active step
    return 'bg-[#CC0000] text-white border-black scale-110';
  } else {
    // Unreached step
    return 'bg-white text-gray-400 border-gray-300';
  }
}

function getStepTextClass(index: number) {
  const currentIndex = currentStepIndex.value;
  if (index < currentIndex) {
    return 'text-black font-semibold';
  } else if (index === currentIndex) {
    return 'text-[#CC0000] font-black uppercase scale-105 origin-left';
  } else {
    return 'text-gray-400 font-medium';
  }
}

function getStepTimestamp(stepName: string) {
  if (!trackingData.value) return '';
  // Match logs with status mappings
  const logs = trackingData.value.logs;
  if (stepName === 'DIPESAN') {
    const log = logs.find(l => l.description.includes('DIBUAT') || l.description.includes('CREATED'));
    return log ? log.timestamp : '';
  }
  if (stepName === 'DIKEMAS') {
    const log = logs.find(l => l.description.includes('DIKEMAS') || l.description.includes('PACK') || l.description.includes('VERIFIKASI'));
    return log ? log.timestamp : '';
  }
  if (stepName === 'SEDANG DIKIRIM') {
    const log = logs.find(l => l.description.includes('DIANTAR') || l.description.includes('KIRIM') || l.description.includes('DIASIGN') || l.description.includes('PICK'));
    return log ? log.timestamp : '';
  }
  if (stepName === 'SUDAH SAMPAI') {
    const log = logs.find(l => l.description.includes('SAMPAI') || l.description.includes('SELESAI') || l.description.includes('DELIVERED'));
    return log ? log.timestamp : '';
  }
  return '';
}
</script>

<template>
  <div class="min-h-screen bg-[#F9F9F9] p-6">
    <div class="max-w-3xl mx-auto">
      
      <!-- Top nav bar -->
      <div class="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
        <button 
          @click="router.back()" 
          class="font-mono font-bold text-xs uppercase hover:underline"
        >
          ← KEMBALI
        </button>
        <div class="flex items-center gap-2">
          <span class="animate-pulse w-2.5 h-2.5 bg-green-500 border border-black rounded-full"></span>
          <span class="font-mono text-xs text-gray-500 uppercase">AUTO_REFRESHING_30S</span>
        </div>
      </div>

      <!-- Header Title -->
      <h1 class="text-4xl font-extrabold uppercase tracking-tighter text-black mb-2 border-b-4 border-black pb-2">
        LOGISTICS PIPELINE
      </h1>
      <p class="font-mono text-lg text-black uppercase font-bold mb-8">
        MANIFEST_REF: <span class="bg-black text-white px-2 py-0.5">{{ orderCode }}</span>
      </p>

      <!-- Grid Layout for Tracking Content -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        
        <!-- Steps pipeline (Col-span 3) -->
        <div class="md:col-span-3 bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 class="text-lg font-black uppercase tracking-tighter text-black border-b-4 border-black pb-2 mb-6">
            PIPELINE_STATUS
          </h2>

          <div class="flex flex-col relative pl-8 border-l-4 border-black ml-4 py-2 gap-8">
            <div 
              v-for="(step, idx) in steps" 
              :key="step"
              class="relative"
            >
              <!-- Indicator circle -->
              <div 
                :class="[
                  'absolute -left-[46px] top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center border-4 font-mono font-bold text-xs select-none transition-all duration-150',
                  getStepClass(idx)
                ]"
              >
                {{ idx + 1 }}
              </div>

              <!-- Step Metadata -->
              <div class="flex flex-col">
                <span :class="['text-sm tracking-wide uppercase', getStepTextClass(idx)]">
                  {{ step }}
                </span>
                <span 
                  v-if="getStepTimestamp(step)" 
                  class="font-mono text-xs text-gray-500 mt-0.5"
                >
                  TIMESTAMP: {{ getStepTimestamp(step) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side info details (Col-span 2) -->
        <div class="md:col-span-2 flex flex-col gap-6">
          
          <!-- COURIER INTEL CARD -->
          <div 
            v-if="trackingData?.courier" 
            class="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 class="text-sm font-black uppercase tracking-tight text-black border-b-2 border-black pb-1 mb-3">
              COURIER_INTEL
            </h2>
            <div class="flex flex-col gap-2 font-mono text-xs text-black">
              <div>
                <p class="text-gray-500 uppercase text-[9px]">OPERATIVE_NAME:</p>
                <p class="font-extrabold uppercase text-sm">{{ trackingData.courier.name }}</p>
              </div>
              <div>
                <p class="text-gray-500 uppercase text-[9px]">COMMUNICATIONS_LINE:</p>
                <a 
                  :href="'tel:' + trackingData.courier.phone"
                  class="text-[#CC0000] font-bold text-xs underline hover:text-black uppercase"
                >
                  ☎ DIAL {{ trackingData.courier.phone }}
                </a>
              </div>
              <div class="mt-1">
                <p class="text-gray-500 uppercase text-[9px] mb-1">FLEET_VEHICLE:</p>
                <Badge :status="trackingData.courier.vehicle_type" />
              </div>
            </div>
          </div>

          <!-- LOG LIST -->
          <div class="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 class="text-sm font-black uppercase tracking-tight text-black border-b-2 border-black pb-1 mb-3">
              DELIVERY_LOGS
            </h2>
            <div class="flex flex-col gap-4 max-h-[300px] overflow-y-auto">
              <div 
                v-for="(log, idx) in trackingData?.logs" 
                :key="idx"
                class="border-b border-gray-100 pb-2 last:border-0 font-mono text-xs"
              >
                <p class="text-gray-400 font-bold uppercase text-[9px]">[{{ log.timestamp }}]</p>
                <p class="text-black font-semibold uppercase mt-0.5 tracking-tighter">{{ log.description }}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>
