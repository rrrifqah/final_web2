<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';
import api from '@/api/axios.js';
import Badge from '@/components/shared/Badge.vue';
import Modal from '@/components/shared/Modal.vue';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

interface DeliveryItem {
  name: string;
  size: string;
  color: string;
  quantity: number;
}

interface Delivery {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  status: string; // 'assigned', 'picked_up', 'delivered', 'failed'
  items: DeliveryItem[];
  fail_reason?: string;
}

const authStore = useAuthStore();
const toastStore = useToastStore();

const deliveries = ref<Delivery[]>([]);
const showFailModal = ref(false);
const showDoneConfirm = ref(false);
const failReason = ref('');
const activeDeliveryId = ref<number | null>(null);
const isLoading = ref(false);
let pollingInterval: number | null = null;

onMounted(() => {
  fetchDeliveries();
  // Auto refresh every 60 seconds
  pollingInterval = window.setInterval(() => {
    fetchDeliveries(true);
  }, 60000);
});

onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});

async function fetchDeliveries(silent = false) {
  if (!silent) isLoading.value = true;
  try {
    const res = await api.get('/api/courier/deliveries');
    deliveries.value = res.data;
  } catch (err) {
    console.error('Failed to fetch courier deliveries:', err);
    // Simulation fallback tasks
    if (deliveries.value.length === 0) {
      deliveries.value = [
        {
          id: 1,
          order_code: 'KT-9928314',
          customer_name: 'Jane Doe',
          customer_phone: '081234567890',
          shipping_address: 'Sudirman Street No. 42, Floor 3, South Jakarta',
          status: 'assigned', // Needs pickup
          items: [
            { name: 'CLINICAL BRUTALIST JACKET', size: 'L', color: 'BLACK', quantity: 1 }
          ]
        },
        {
          id: 2,
          order_code: 'KT-4812391',
          customer_name: 'John Smith',
          customer_phone: '089988776655',
          shipping_address: 'Gatot Subroto St. Block D3, South Jakarta',
          status: 'picked_up', // In delivery
          items: [
            { name: 'RAW CONTRAST HOODIE', size: 'M', color: 'WHITE', quantity: 2 }
          ]
        }
      ];
    }
  } finally {
    isLoading.value = false;
  }
}

// Mini Stats
const totalTasks = computed(() => deliveries.value.length);
const completedTasks = computed(() => deliveries.value.filter(d => ['delivered', 'selesai'].includes(d.status)).length);
const pendingTasks = computed(() => deliveries.value.filter(d => ['assigned', 'picked_up', 'delivering'].includes(d.status)).length);

async function handlePickup(id: number) {
  isLoading.value = true;
  try {
    await api.post(`/api/courier/deliveries/${id}/pickup`);
    toastStore.trigger('PACKAGE_PICKED_UP_SUCCESS', 'success');
    fetchDeliveries();
  } catch (err) {
    console.error('Failed to pickup package:', err);
    // Simulation local update
    const target = deliveries.value.find(d => d.id === id);
    if (target) {
      target.status = 'picked_up';
    }
    toastStore.trigger('PICKUP_SIMULATED_SUCCESS', 'success');
  } finally {
    isLoading.value = false;
  }
}

function triggerDone(id: number) {
  activeDeliveryId.value = id;
  showDoneConfirm.value = true;
}

async function handleDone() {
  if (activeDeliveryId.value === null) return;
  isLoading.value = true;
  try {
    await api.post(`/api/courier/deliveries/${activeDeliveryId.value}/done`);
    toastStore.trigger('DELIVERY_COMPLETED_SUCCESS', 'success');
    showDoneConfirm.value = false;
    activeDeliveryId.value = null;
    fetchDeliveries();
  } catch (err) {
    console.error('Failed to complete delivery:', err);
    // Simulation local update
    const target = deliveries.value.find(d => d.id === activeDeliveryId.value);
    if (target) {
      target.status = 'delivered';
    }
    toastStore.trigger('DELIVERY_COMPLETED_SIMULATED', 'success');
    showDoneConfirm.value = false;
    activeDeliveryId.value = null;
  } finally {
    isLoading.value = false;
  }
}

function triggerFailed(id: number) {
  activeDeliveryId.value = id;
  failReason.value = '';
  showFailModal.value = true;
}

async function handleFailed() {
  if (activeDeliveryId.value === null || !failReason.value.trim()) {
    toastStore.trigger('REASON_REQUIRED', 'error');
    return;
  }
  
  isLoading.value = true;
  try {
    await api.post(`/api/courier/deliveries/${activeDeliveryId.value}/failed`, {
      reason: failReason.value
    });
    toastStore.trigger('DELIVERY_FAILURE_SUBMITTED', 'success');
    showFailModal.value = false;
    activeDeliveryId.value = null;
    fetchDeliveries();
  } catch (err) {
    console.error('Failed to submit failure:', err);
    // Simulation local update
    const target = deliveries.value.find(d => d.id === activeDeliveryId.value);
    if (target) {
      target.status = 'failed';
      target.fail_reason = failReason.value;
    }
    toastStore.trigger('FAILURE_REPORT_SIMULATED', 'success');
    showFailModal.value = false;
    activeDeliveryId.value = null;
  } finally {
    isLoading.value = false;
  }
}

function openMaps(address: string) {
  window.open('https://maps.google.com/?q=' + encodeURIComponent(address), '_blank');
}
</script>

<template>
  <div class="flex flex-col gap-6 select-none font-sans">
    
    <!-- Welcome Header -->
    <div class="bg-black text-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h2 class="text-xs font-mono text-gray-400 uppercase tracking-widest">ACTIVE_OPERATIVE</h2>
      <h3 class="text-lg font-black uppercase tracking-tight mt-1">
        SELAMAT DATANG, {{ authStore.user?.name || 'OPERATIVE' }}
      </h3>
    </div>

    <!-- Mini stats metrics -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="bg-white border-4 border-black p-2">
        <p class="font-mono text-[9px] text-gray-500 uppercase font-bold">TOTAL_TASKS</p>
        <p class="font-black text-lg text-black">{{ totalTasks }}</p>
      </div>
      <div class="bg-white border-4 border-black p-2">
        <p class="font-mono text-[9px] text-gray-500 uppercase font-bold">COMPLETED</p>
        <p class="font-black text-lg text-green-600">{{ completedTasks }}</p>
      </div>
      <div class="bg-white border-4 border-black p-2">
        <p class="font-mono text-[9px] text-gray-500 uppercase font-bold">PENDING</p>
        <p class="font-black text-lg text-[#CC0000]">{{ pendingTasks }}</p>
      </div>
    </div>

    <!-- Title Divider -->
    <h2 class="text-xl font-black uppercase tracking-tighter text-black border-b-4 border-black pb-1.5 mt-2">
      ACTIVE_DEPLOYMENTS
    </h2>

    <!-- Empty State -->
    <div 
      v-if="deliveries.length === 0" 
      class="border-4 border-black p-8 text-center bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-xs font-bold text-gray-500"
    >
      NO_ACTIVE_DEPLOYMENTS — STANDBY
    </div>

    <!-- Active tasks list (v-for) -->
    <div v-else class="flex flex-col gap-5">
      <div 
        v-for="d in deliveries" 
        :key="d.id"
        class="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col gap-3"
      >
        <!-- Top head details -->
        <div class="flex justify-between items-start border-b border-gray-200 pb-2">
          <span class="font-mono font-bold text-sm bg-black text-white px-2 py-0.5">{{ d.order_code }}</span>
          <Badge :status="d.status" />
        </div>

        <!-- Product Specs list -->
        <div class="font-mono text-xs flex flex-col gap-1 text-black font-semibold border-b border-gray-100 pb-2">
          <div v-for="(item, idx) in d.items" :key="idx" class="flex justify-between">
            <span class="uppercase">◼ {{ item.name }} ({{ item.size }} / {{ item.color }})</span>
            <span class="font-bold text-gray-500">x{{ item.quantity }}</span>
          </div>
        </div>

        <!-- Customer info details -->
        <div class="text-xs text-black">
          <p class="font-mono text-[9px] text-gray-400 uppercase">RECIPIENT_CUSTOMER:</p>
          <p class="font-extrabold uppercase mt-0.5">{{ d.customer_name }}</p>
          
          <p class="font-mono text-[9px] text-gray-400 uppercase mt-2">DELIVERY_ADDRESS:</p>
          <p class="font-semibold uppercase mt-0.5 leading-relaxed">{{ d.shipping_address }}</p>

          <p class="font-mono text-[9px] text-gray-400 uppercase mt-2">COMMS_CHANNEL:</p>
          <a 
            :href="'tel:' + d.customer_phone" 
            class="text-[#CC0000] font-mono font-bold text-xs underline hover:text-black mt-0.5 block uppercase"
          >
            ☎ DIAL {{ d.customer_phone }}
          </a>
        </div>

        <!-- Error reason display if failed -->
        <div 
          v-if="d.status === 'failed' && d.fail_reason"
          class="bg-red-50 border-2 border-[#CC0000] p-2.5 text-xs text-[#CC0000] font-mono font-bold"
        >
          FAILURE_REASON: {{ d.fail_reason }}
        </div>

        <!-- Action buttons flow -->
        <div class="flex flex-col gap-2 mt-2 select-none" v-if="d.status !== 'delivered' && d.status !== 'selesai' && d.status !== 'failed'">
          
          <!-- Assigned (Needs pickup) -->
          <button 
            v-if="d.status === 'assigned'"
            @click="handlePickup(d.id)"
            :disabled="isLoading"
            class="w-full brutalist-button-red bg-[#CC0000] text-white hover:bg-black font-bold uppercase py-2.5 text-xs border-2 border-black"
          >
            AMBIL PAKET
          </button>

          <!-- Picked up or delivering -->
          <template v-if="['picked_up', 'delivering', 'pickedup', 'sedang dikirim'].includes(d.status.toLowerCase())">
            <button 
              @click="triggerDone(d.id)"
              :disabled="isLoading"
              class="w-full brutalist-button-red bg-[#CC0000] text-white hover:bg-black font-bold uppercase py-2.5 text-xs border-2 border-black"
            >
              SUDAH SAMPAI
            </button>
            <div class="grid grid-cols-2 gap-2">
              <button 
                @click="triggerFailed(d.id)"
                :disabled="isLoading"
                class="brutalist-button bg-black text-white hover:bg-gray-800 font-bold uppercase py-2 text-xs"
              >
                GAGAL ANTAR
              </button>
              <button 
                @click="openMaps(d.shipping_address)"
                class="brutalist-button bg-white text-black hover:bg-gray-100 font-bold uppercase py-2 text-xs border border-black"
              >
                MAP VIEW
              </button>
            </div>
          </template>

        </div>
      </div>
    </div>

    <!-- Done Confirmation Modal -->
    <Modal 
      :show="showDoneConfirm" 
      title="DELIVERY_SUCCESS_CONFIRM" 
      @close="showDoneConfirm = false"
    >
      <p class="mb-4 font-semibold text-black">Confirm that the parcel has been successfully handed over to the customer?</p>
      <div class="flex justify-end gap-2">
        <button @click="showDoneConfirm = false" class="brutalist-button py-2 px-4 text-xs">CANCEL</button>
        <button @click="handleDone" class="brutalist-button-red py-2 px-4 text-xs">CONFIRM_DELIVERY</button>
      </div>
    </Modal>

    <!-- Failed Reason Modal -->
    <Modal 
      :show="showFailModal" 
      title="DELIVERY_FAILURE_SUBMISSION" 
      @close="showFailModal = false"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="block font-mono text-xs font-bold text-gray-500 uppercase mb-1">FAILURE_REASON_EXPLANATION *</label>
          <textarea 
            v-model="failReason" 
            rows="3" 
            class="w-full border-2 border-black p-2 text-sm focus:bg-gray-50 outline-none uppercase font-semibold"
            placeholder="e.g. CUSTOMER UNREACHABLE / INCORRECT ADDRESS DETAILS"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button 
            @click="showFailModal = false"
            class="brutalist-button py-2 px-4 text-xs"
          >
            BATAL
          </button>
          <button 
            @click="handleFailed"
            :disabled="!failReason.trim() || isLoading"
            class="brutalist-button-red bg-[#CC0000] text-white hover:bg-black py-2 px-4 text-xs font-bold border-2 border-black active:scale-95 transition-all text-center uppercase"
          >
            KONFIRMASI GAGAL
          </button>
        </div>
      </div>
    </Modal>

  </div>
</template>
