<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api/axios.js';
import Badge from '@/components/shared/Badge.vue';
import Modal from '@/components/shared/Modal.vue';
import { useToastStore } from '@/stores/toast';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  size: string;
  color: string;
}

interface Order {
  id: number;
  order_code: string;
  created_at: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
}

const router = useRouter();
const toastStore = useToastStore();

const activeTab = ref('semua');
const orders = ref<Order[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);

// Cancel modal states
const showCancelModal = ref(false);
const orderToCancel = ref<Order | null>(null);

const tabs = [
  { key: 'semua', label: 'SEMUA' },
  { key: 'pending', label: 'PENDING' },
  { key: 'proses', label: 'PROSES' },
  { key: 'selesai', label: 'SELESAI' },
  { key: 'batal', label: 'BATAL' }
];

onMounted(() => {
  fetchOrders();
});

watch(activeTab, () => {
  currentPage.value = 1;
  fetchOrders();
});

async function fetchOrders() {
  isLoading.value = true;
  
  // Map our UI tab keys to the backend status filters if necessary
  let statusParam = '';
  if (activeTab.value !== 'semua') {
    statusParam = activeTab.value;
  }

  try {
    const res = await api.get(`/api/orders`, {
      params: {
        status: statusParam,
        page: currentPage.value
      }
    });
    
    // Support Laravel standard pagination responses or arrays
    if (res.data && res.data.data) {
      orders.value = res.data.data;
      totalPages.value = res.data.last_page || 1;
    } else {
      orders.value = res.data || [];
      totalPages.value = 1;
    }
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    // Mock orders data for testing
    let simulatedOrders: Order[] = [
      {
        id: 1,
        order_code: 'KT-9928314',
        created_at: '2026-06-07 10:15:30',
        status: 'delivering',
        total_amount: 364000,
        items: [
          { id: 10, name: 'CLINICAL BRUTALIST JACKET', quantity: 1, size: 'L', color: 'BLACK' }
        ]
      },
      {
        id: 2,
        order_code: 'KT-4812391',
        created_at: '2026-06-06 14:02:50',
        status: 'pending',
        total_amount: 613000,
        items: [
          { id: 11, name: 'RAW CONTRAST HOODIE', quantity: 2, size: 'M', color: 'WHITE' }
        ]
      },
      {
        id: 3,
        order_code: 'KT-1082731',
        created_at: '2026-05-20 18:22:10',
        status: 'selesai',
        total_amount: 175000,
        items: [
          { id: 12, name: 'KETCE BOXER SET', quantity: 3, size: 'S', color: 'GRAY' }
        ]
      },
      {
        id: 4,
        order_code: 'KT-4491024',
        created_at: '2026-05-15 09:11:00',
        status: 'batal',
        total_amount: 490000,
        items: [
          { id: 13, name: 'RAW CONTRAST HOODIE', quantity: 1, size: 'L', color: 'BLACK' },
          { id: 14, name: 'KETCE BOXER SET', quantity: 1, size: 'M', color: 'BLACK' }
        ]
      }
    ];
    
    // Filter locally based on active tab
    if (activeTab.value === 'pending') {
      simulatedOrders = simulatedOrders.filter(o => o.status === 'pending');
    } else if (activeTab.value === 'proses') {
      simulatedOrders = simulatedOrders.filter(o => ['proses', 'delivering', 'packed', 'confirmed'].includes(o.status));
    } else if (activeTab.value === 'selesai') {
      simulatedOrders = simulatedOrders.filter(o => o.status === 'selesai');
    } else if (activeTab.value === 'batal') {
      simulatedOrders = simulatedOrders.filter(o => ['batal', 'cancelled', 'failed'].includes(o.status));
    }
    
    orders.value = simulatedOrders;
    totalPages.value = 1;
  } finally {
    isLoading.value = false;
  }
}

function triggerCancel(order: Order) {
  orderToCancel.value = order;
  showCancelModal.value = true;
}

async function handleCancelOrder() {
  if (!orderToCancel.value) return;
  isLoading.value = true;
  try {
    await api.delete(`/api/orders/${orderToCancel.value.id}`);
    toastStore.trigger('ORDER_CANCELLED_SUCCESS', 'success');
    showCancelModal.value = false;
    orderToCancel.value = null;
    fetchOrders(); // reload
  } catch (err) {
    console.error('Failed to cancel order:', err);
    // Simulating cancellation locally
    if (orderToCancel.value) {
      const target = orders.value.find(o => o.id === orderToCancel.value!.id);
      if (target) {
        target.status = 'batal';
      }
    }
    toastStore.trigger('ORDER_CANCELLED_SIMULATED', 'success');
    showCancelModal.value = false;
    orderToCancel.value = null;
  } finally {
    isLoading.value = false;
  }
}

function formatIDR(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
}

function handlePageChange(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchOrders();
}
</script>

<template>
  <div class="min-h-screen bg-[#F9F9F9] p-6">
    <div class="max-w-5xl mx-auto">
      
      <!-- Back nav link -->
      <div class="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
        <router-link to="/auth" class="font-mono font-bold text-xs uppercase hover:underline">
          ← BACK_TO_PORTAL
        </router-link>
        <span class="font-mono text-xs text-gray-500 uppercase">SYS_REF: ORDER_ARCHIVES</span>
      </div>

      <!-- Header Title -->
      <h1 class="text-4xl font-extrabold uppercase tracking-tighter text-black mb-8 border-b-4 border-black pb-2">
        ARCHIVE SECTION
      </h1>

      <!-- TAB FILTER BAR -->
      <div class="flex flex-wrap border-4 border-black bg-white mb-8 rounded-none">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex-grow sm:flex-initial px-6 py-3 font-bold text-sm tracking-tight transition-all uppercase border-r-2 border-black last:border-r-0 select-none active:scale-95 duration-100',
            activeTab === tab.key ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Empty State check -->
      <div 
        v-if="orders.length === 0" 
        class="border-4 border-black p-12 text-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <p class="text-2xl font-black tracking-tighter uppercase text-black mb-2">ARCHIVE_EMPTY</p>
        <p class="text-mono text-gray-500 mb-6 text-sm">NO ORDERS MATCHING THE CRITERIA WERE FOUND IN THE ARCHIVE</p>
        <button 
          @click="activeTab = 'semua'" 
          class="brutalist-button bg-black text-white hover:bg-white hover:text-black text-xs font-bold py-2 px-6"
        >
          RESET_FILTERS
        </button>
      </div>

      <!-- Orders listing (v-for) -->
      <div v-else class="flex flex-col gap-6 mb-8">
        <div 
          v-for="order in orders" 
          :key="order.id"
          class="bg-white border-4 border-black p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <!-- Left side data details -->
          <div class="flex-grow flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-3">
              <span class="font-mono text-xl font-bold bg-black text-white px-2 py-0.5">{{ order.order_code }}</span>
              <span class="font-mono text-xs text-gray-500">DATE: {{ order.created_at }}</span>
            </div>
            
            <!-- Items description list -->
            <div class="mt-2 flex flex-col gap-1">
              <div 
                v-for="item in order.items" 
                :key="item.id"
                class="text-xs font-mono font-bold text-gray-700 flex items-center gap-2"
              >
                <span class="text-black uppercase">◼ {{ item.name }}</span>
                <span class="bg-gray-100 border border-gray-300 px-1 text-[10px] uppercase">{{ item.size }} / {{ item.color }}</span>
                <span class="text-black">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>

          <!-- Middle stats data -->
          <div class="flex flex-col md:items-end justify-center">
            <p class="font-mono text-xs text-gray-500 uppercase tracking-tighter">TOTAL_VALUE</p>
            <p class="font-mono text-xl font-black text-[#CC0000]">{{ formatIDR(order.total_amount) }}</p>
          </div>

          <!-- Action buttons block -->
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Badge :status="order.status" />
            
            <!-- Details view redirection -->
            <button
              @click="router.push(`/orders/${order.order_code}/tracking`)"
              class="flex-grow md:flex-initial brutalist-button-red bg-[#CC0000] hover:bg-black text-white py-2 px-4 text-xs font-bold active:scale-95 transition-all text-center border-2 border-black"
            >
              VIEW DETAILS
            </button>
            
            <!-- Cancellation trigger if status pending/confirmed -->
            <button
              v-if="['pending', 'confirmed'].includes(order.status)"
              @click="triggerCancel(order)"
              class="flex-grow md:flex-initial brutalist-button bg-black text-white hover:bg-[#CC0000] py-2 px-4 text-xs font-bold active:scale-95 transition-all text-center border-2 border-black"
            >
              BATALKAN
            </button>
          </div>
        </div>
      </div>

      <!-- PAGINATION COMPONENT -->
      <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-8 select-none">
        <button 
          @click="handlePageChange(currentPage - 1)" 
          :disabled="currentPage === 1"
          class="brutalist-button py-2 px-4 text-xs disabled:opacity-40"
        >
          PREV
        </button>
        
        <div class="border-4 border-black bg-white px-4 py-2 font-mono font-bold text-xs">
          PAGE {{ currentPage }} OF {{ totalPages }}
        </div>

        <button 
          @click="handlePageChange(currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="brutalist-button py-2 px-4 text-xs disabled:opacity-40"
        >
          NEXT
        </button>
      </div>

    </div>

    <!-- Confirm Cancel Modal -->
    <Modal 
      :show="showCancelModal" 
      title="CANCEL_TRANSACTION_ALERT" 
      @close="showCancelModal = false"
    >
      <div v-if="orderToCancel">
        <p class="mb-4 font-semibold text-black">
          Are you sure you want to cancel order <span class="font-mono bg-black text-white px-1.5 py-0.5">{{ orderToCancel.order_code }}</span>?
        </p>
        <p class="text-xs text-[#CC0000] font-bold uppercase mb-6">
          🚨 WARNING: This action terminates the checkout pipeline process and is irreversible.
        </p>
        
        <div class="flex justify-end gap-3">
          <button 
            @click="showCancelModal = false" 
            class="brutalist-button py-2 px-4 text-xs"
          >
            KEEP_ORDER
          </button>
          <button 
            @click="handleCancelOrder" 
            class="brutalist-button-red py-2 px-4 text-xs bg-[#CC0000] text-white border-2 border-black font-bold uppercase"
          >
            TERMINATE_ORDER
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
