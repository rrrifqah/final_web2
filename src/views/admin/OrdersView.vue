<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import api from '@/api/axios.js';
import Badge from '@/components/shared/Badge.vue';
import Modal from '@/components/shared/Modal.vue';
import { useToastStore } from '@/stores/toast';

interface Courier {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  is_active: boolean;
}

interface OrderItem {
  name: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  payment_status: string; // 'pending', 'paid', 'failed'
  order_status: string; // 'pending', 'confirmed', 'packed', 'delivering', 'delivered', 'batal'
  created_at: string;
  shipping_address: string;
  payment_proof_url: string;
  courier_id: number | null;
  courier: Courier | null;
  logs: { timestamp: string; description: string }[];
  items: OrderItem[];
}

const toastStore = useToastStore();
const orders = ref<Order[]>([]);
const activeCouriers = ref<Courier[]>([]);
const isLoading = ref(false);

const filters = reactive({
  status: '',
  date: '',
  search: ''
});

// Modal views controls
const selectedOrder = ref<Order | null>(null);
const showDetailModal = ref(false);
const showPaymentModal = ref(false);
const showAssignModal = ref(false);
const showCancelModal = ref(false);

// Local bindings
const selectedCourierId = ref<number | null>(null);

onMounted(() => {
  fetchOrders();
  fetchCouriers();
});

async function fetchOrders() {
  isLoading.value = true;
  try {
    const res = await api.get('/api/admin/orders', {
      params: {
        status: filters.status,
        date: filters.date,
        search: filters.search
      }
    });
    // Support Laravel standard pagination responses or arrays
    orders.value = res.data.data || res.data;
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    // Simulation fallbacks for local test environments
    orders.value = [
      {
        id: 1,
        order_code: 'KT-9928314',
        customer_name: 'Jane Doe',
        customer_email: 'jane@gmail.com',
        customer_phone: '081234567890',
        total_amount: 364000,
        payment_status: 'pending', // pending approval
        order_status: 'pending',
        created_at: '2026-06-07 10:15:30',
        shipping_address: 'Sudirman Street No. 42, Floor 3, South Jakarta, DKI Jakarta',
        payment_proof_url: 'https://via.placeholder.com/400x600/ccc/000?text=PROOF_OF_PAYMENT_SLIP_KT-9928314',
        courier_id: null,
        courier: null,
        logs: [
          { timestamp: '2026-06-07 10:15:30', description: 'PESANAN BERHASIL DIBUAT' }
        ],
        items: [{ name: 'CLINICAL BRUTALIST JACKET', sku: 'KT-JKT-01', size: 'L', color: 'BLACK', quantity: 1, price: 349000 }]
      },
      {
        id: 2,
        order_code: 'KT-4812391',
        customer_name: 'John Smith',
        customer_email: 'smith@yahoo.com',
        customer_phone: '089988776655',
        total_amount: 613000,
        payment_status: 'paid',
        order_status: 'confirmed', // Confirmed, needs packing
        created_at: '2026-06-07 09:30:12',
        shipping_address: 'Gatot Subroto St. Block D3, South Jakarta, DKI Jakarta',
        payment_proof_url: '',
        courier_id: null,
        courier: null,
        logs: [
          { timestamp: '2026-06-07 09:35:00', description: 'PEMBAYARAN DIVERIFIKASI' },
          { timestamp: '2026-06-07 09:30:12', description: 'PESANAN BERHASIL DIBUAT' }
        ],
        items: [{ name: 'RAW CONTRAST HOODIE', sku: 'KT-HD-03', size: 'M', color: 'WHITE', quantity: 2, price: 299000 }]
      },
      {
        id: 3,
        order_code: 'KT-1082731',
        customer_name: 'Alice Widyawati',
        customer_email: 'alice.w@outlook.com',
        customer_phone: '0855667788',
        total_amount: 175000,
        payment_status: 'paid',
        order_status: 'packed', // Packed, needs courier assign
        created_at: '2026-06-06 18:22:10',
        shipping_address: 'Kuningan Raya No. 12, South Jakarta, DKI Jakarta',
        payment_proof_url: '',
        courier_id: null,
        courier: null,
        logs: [
          { timestamp: '2026-06-06 19:40:00', description: 'PESANAN BERHASIL DIKEMAS' },
          { timestamp: '2026-06-06 18:40:00', description: 'PEMBAYARAN DIVERIFIKASI' },
          { timestamp: '2026-06-06 18:22:10', description: 'PESANAN BERHASIL DIBUAT' }
        ],
        items: [{ name: 'KETCE BOXER SET', sku: 'KT-BX-02', size: 'S', color: 'GRAY', quantity: 3, price: 53333 }]
      }
    ];
  } finally {
    isLoading.value = false;
  }
}

async function fetchCouriers() {
  try {
    const res = await api.get('/api/admin/couriers');
    activeCouriers.value = (res.data || []).filter((c: any) => c.is_active);
  } catch (err) {
    console.error('Failed to fetch couriers:', err);
    activeCouriers.value = [
      { id: 1, name: 'Budi Santoso', phone: '081299881122', vehicle_type: 'E-BIKE', is_active: true },
      { id: 2, name: 'Agus Prayogo', phone: '08781223344', vehicle_type: 'LIGHT-VAN', is_active: true }
    ];
  }
}

function triggerPaymentConfirm(order: Order) {
  selectedOrder.value = order;
  showPaymentModal.value = true;
}

async function handleVerifyPayment(approve: boolean) {
  if (!selectedOrder.value) return;
  isLoading.value = true;
  try {
    const endpoint = approve ? 'confirm-payment' : 'reject-payment';
    await api.patch(`/api/admin/orders/${selectedOrder.value.id}/${endpoint}`);
    toastStore.trigger(`PAYMENT_${approve ? 'APPROVED' : 'REJECTED'}_SUCCESS`, 'success');
    showPaymentModal.value = false;
    fetchOrders();
  } catch (err) {
    console.error('Failed to verify payment:', err);
    // Simulating locally
    const target = orders.value.find(o => o.id === selectedOrder.value!.id);
    if (target) {
      target.payment_status = approve ? 'paid' : 'failed';
      target.order_status = approve ? 'confirmed' : 'batal';
      target.logs.unshift({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        description: approve ? 'PEMBAYARAN DIVERIFIKASI' : 'PEMBAYARAN DITOLAK'
      });
    }
    toastStore.trigger('PAYMENT_VERIFIED_SIMULATED', 'success');
    showPaymentModal.value = false;
  } finally {
    isLoading.value = false;
  }
}

async function handleMarkPacked(order: Order) {
  isLoading.value = true;
  try {
    await api.patch(`/api/admin/orders/${order.id}/pack`);
    toastStore.trigger('ORDER_MARKED_PACKED_SUCCESS', 'success');
    fetchOrders();
  } catch (err) {
    console.error('Failed to mark packed:', err);
    order.order_status = 'packed';
    order.logs.unshift({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      description: 'PESANAN BERHASIL DIKEMAS'
    });
    toastStore.trigger('ORDER_PACKED_SIMULATED', 'success');
  } finally {
    isLoading.value = false;
  }
}

function triggerAssign(order: Order) {
  selectedOrder.value = order;
  selectedCourierId.value = activeCouriers.value[0]?.id || null;
  showAssignModal.value = true;
}

async function handleAssignCourier() {
  if (!selectedOrder.value || !selectedCourierId.value) return;
  isLoading.value = true;
  try {
    await api.patch(`/api/admin/orders/${selectedOrder.value.id}/assign`, {
      courier_id: selectedCourierId.value
    });
    toastStore.trigger('COURIER_ASSIGNED_SUCCESS', 'success');
    showAssignModal.value = false;
    fetchOrders();
  } catch (err) {
    console.error('Failed to assign courier:', err);
    // Simulating locally
    const courierObj = activeCouriers.value.find(c => c.id === selectedCourierId.value);
    const target = orders.value.find(o => o.id === selectedOrder.value!.id);
    if (target && courierObj) {
      target.courier_id = courierObj.id;
      target.courier = courierObj;
      target.order_status = 'delivering';
      target.logs.unshift({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        description: `PESANAN DISERAHKAN KE KURIR ${courierObj.name}`
      });
    }
    toastStore.trigger('COURIER_ASSIGNED_SIMULATED', 'success');
    showAssignModal.value = false;
  } finally {
    isLoading.value = false;
  }
}

function triggerCancel(order: Order) {
  selectedOrder.value = order;
  showCancelModal.value = true;
}

async function handleCancelOrder() {
  if (!selectedOrder.value) return;
  isLoading.value = true;
  try {
    await api.delete(`/api/admin/orders/${selectedOrder.value.id}`);
    toastStore.trigger('ORDER_CANCELLED_SUCCESS', 'success');
    showCancelModal.value = false;
    fetchOrders();
  } catch (err) {
    console.error('Failed to cancel order:', err);
    const target = orders.value.find(o => o.id === selectedOrder.value!.id);
    if (target) {
      target.order_status = 'batal';
      target.logs.unshift({
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        description: 'PESANAN DIBATALKAN OLEH ADMIN'
      });
    }
    toastStore.trigger('ORDER_CANCELLED_SIMULATED', 'success');
    showCancelModal.value = false;
  } finally {
    isLoading.value = false;
  }
}

function openOrderDetails(order: Order) {
  selectedOrder.value = order;
  showDetailModal.value = true;
}

function formatIDR(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
}
</script>

<template>
  <div class="flex flex-col gap-6 select-none">
    
    <!-- FILTER BAR -->
    <div class="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div class="flex flex-wrap items-end gap-4">
        
        <!-- Status Dropdown -->
        <div class="flex-grow sm:flex-initial">
          <label class="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1">FILTER_STATUS</label>
          <select 
            v-model="filters.status" 
            class="w-full sm:w-48 border-2 border-black p-2 font-mono text-xs focus:bg-gray-50 outline-none uppercase font-bold"
          >
            <option value="">ALL_STATUS</option>
            <option value="pending">PENDING</option>
            <option value="confirmed">CONFIRMED</option>
            <option value="packed">PACKED</option>
            <option value="delivering">DELIVERING</option>
            <option value="delivered">DELIVERED</option>
            <option value="batal">BATAL</option>
          </select>
        </div>

        <!-- Date Input -->
        <div class="flex-grow sm:flex-initial">
          <label class="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1">FILTER_DATE</label>
          <input 
            v-model="filters.date" 
            type="date" 
            class="w-full sm:w-44 border-2 border-black p-1.5 font-mono text-xs focus:bg-gray-50 outline-none" 
          />
        </div>

        <!-- Search Bar -->
        <div class="flex-grow">
          <label class="block font-mono text-[10px] font-bold text-gray-500 uppercase mb-1">SEARCH_QUERY (CODE/NAME)</label>
          <input 
            v-model="filters.search" 
            type="text" 
            class="w-full border-2 border-black p-2 text-xs focus:bg-gray-50 outline-none uppercase" 
            placeholder="KT-XXXX OR CUSTOMER NAME" 
          />
        </div>

        <!-- Apply Button -->
        <button 
          @click="fetchOrders"
          class="brutalist-button bg-black text-white hover:bg-white hover:text-black py-2 px-6 text-xs font-bold w-full sm:w-auto uppercase"
        >
          FILTER
        </button>

      </div>
    </div>

    <!-- TABLE -->
    <div class="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border-4 border-black text-left text-sm text-black">
          <thead class="bg-black text-white text-xs uppercase tracking-wider font-bold">
            <tr>
              <th class="border-2 border-black p-3 font-mono">ORDER CODE</th>
              <th class="border-2 border-black p-3">CUSTOMER</th>
              <th class="border-2 border-black p-3 text-right">TOTAL</th>
              <th class="border-2 border-black p-3 text-center">STATUS BAYAR</th>
              <th class="border-2 border-black p-3 text-center">STATUS PESANAN</th>
              <th class="border-2 border-black p-3 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black font-medium">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50 transition-all border-b border-black">
              <!-- Code click details -->
              <td 
                @click="openOrderDetails(order)"
                class="border-2 border-black p-3 font-mono font-bold hover:underline cursor-pointer text-blue-600"
              >
                {{ order.order_code }}
              </td>
              <!-- Customer -->
              <td class="border-2 border-black p-3 uppercase">{{ order.customer_name }}</td>
              <!-- Total -->
              <td class="border-2 border-black p-3 font-mono text-right font-bold text-[#CC0000]">
                {{ formatIDR(order.total_amount) }}
              </td>
              <!-- Pay status -->
              <td class="border-2 border-black p-3 text-center">
                <Badge :status="order.payment_status" />
              </td>
              <!-- Order status -->
              <td class="border-2 border-black p-3 text-center">
                <Badge :status="order.order_status" />
              </td>
              <!-- Dynamic Actions -->
              <td class="border-2 border-black p-3 text-center">
                <div class="flex justify-center flex-wrap gap-2 select-none">
                  
                  <!-- Verify payment -->
                  <button 
                    v-if="order.payment_status === 'pending' && order.order_status !== 'batal'"
                    @click="triggerPaymentConfirm(order)"
                    class="brutalist-button py-1 px-3 text-[10px] bg-white border border-black hover:bg-black hover:text-white"
                  >
                    KONFIRMASI BAYAR
                  </button>

                  <!-- Mark packed -->
                  <button 
                    v-if="['paid', 'confirmed'].includes(order.order_status)"
                    @click="handleMarkPacked(order)"
                    class="brutalist-button py-1 px-3 text-[10px] bg-white border border-black hover:bg-black hover:text-white"
                  >
                    TANDAI DIKEMAS
                  </button>

                  <!-- Assign courier -->
                  <button 
                    v-if="order.order_status === 'packed'"
                    @click="triggerAssign(order)"
                    class="brutalist-button py-1 px-3 text-[10px] bg-white border border-black hover:bg-black hover:text-white"
                  >
                    ASSIGN KURIR
                  </button>

                  <!-- Cancel -->
                  <button 
                    v-if="['pending', 'confirmed'].includes(order.order_status)"
                    @click="triggerCancel(order)"
                    class="brutalist-button py-1 px-3 text-[10px] bg-[#CC0000] text-white border border-black hover:bg-black hover:text-white"
                  >
                    BATALKAN
                  </button>

                  <span v-if="order.order_status === 'delivered' || order.order_status === 'selesai' || order.order_status === 'batal'" class="text-[10px] font-mono text-gray-400 font-bold uppercase">
                    NO_ACTION
                  </span>

                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <Modal 
      :show="showDetailModal" 
      title="DEPLOYMENT_AUDIT_LOG" 
      @close="showDetailModal = false"
    >
      <div v-if="selectedOrder" class="font-mono text-xs text-black flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4 border-b-2 border-dashed border-black pb-3">
          <div>
            <p class="text-gray-400 uppercase text-[9px]">ORDER_CODE</p>
            <p class="font-bold text-sm bg-black text-white px-2 py-0.5 inline-block mt-0.5">{{ selectedOrder.order_code }}</p>
          </div>
          <div>
            <p class="text-gray-400 uppercase text-[9px]">DATE_ISSUED</p>
            <p class="font-bold text-sm mt-0.5">{{ selectedOrder.created_at }}</p>
          </div>
        </div>

        <div class="border-b-2 border-dashed border-black pb-3">
          <p class="text-gray-400 uppercase text-[9px]">CUSTOMER_PROFILE</p>
          <p class="font-bold text-sm uppercase mt-0.5">{{ selectedOrder.customer_name }}</p>
          <p class="text-gray-500">{{ selectedOrder.customer_email }}</p>
          <p class="text-gray-500">PHONE: {{ selectedOrder.customer_phone }}</p>
        </div>

        <div class="border-b-2 border-dashed border-black pb-3">
          <p class="text-gray-400 uppercase text-[9px]">SHIPPING_DESTINATION</p>
          <p class="font-semibold text-black uppercase mt-0.5">{{ selectedOrder.shipping_address }}</p>
        </div>

        <!-- Courier Assigned -->
        <div class="border-b-2 border-dashed border-black pb-3" v-if="selectedOrder.courier">
          <p class="text-gray-400 uppercase text-[9px]">COURIER_FLEET_OPERATIVE</p>
          <p class="font-bold text-sm uppercase mt-0.5">NAME: {{ selectedOrder.courier.name }}</p>
          <p class="text-gray-500">CONTACT: {{ selectedOrder.courier.phone }}</p>
          <p class="text-gray-500 mt-1 uppercase">VEHICLE: <Badge :status="selectedOrder.courier.vehicle_type" /></p>
        </div>

        <!-- Pipeline tracking logs -->
        <div class="border-b-2 border-dashed border-black pb-3">
          <p class="text-gray-400 uppercase text-[9px] mb-2">STATUS_HISTORY_LOGS</p>
          <div class="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
            <div 
              v-for="(log, idx) in selectedOrder.logs" 
              :key="idx"
              class="border-b border-gray-100 pb-1 font-mono text-[11px]"
            >
              <span class="text-gray-400">[{{ log.timestamp }}]</span>
              <span class="text-black uppercase ml-2 font-bold">{{ log.description }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center bg-gray-100 border-2 border-black p-3">
          <span class="font-bold text-sm uppercase">TOTAL_DEPLOYMENT_VAL:</span>
          <span class="font-black text-lg text-[#CC0000]">{{ formatIDR(selectedOrder.total_amount) }}</span>
        </div>
      </div>
    </Modal>

    <!-- VERIFY PAYMENT PROOF MODAL -->
    <Modal 
      :show="showPaymentModal" 
      title="VERIFY_TRANSACTION_PAYMENT" 
      @close="showPaymentModal = false"
    >
      <div v-if="selectedOrder" class="flex flex-col gap-4">
        <p class="font-semibold text-black text-sm uppercase tracking-tight">
          Verify payment transfer slip for <span class="bg-black text-white px-2 py-0.5">{{ selectedOrder.order_code }}</span>.
        </p>

        <!-- Preview proof receipt slip -->
        <div class="border-4 border-black bg-gray-100 flex items-center justify-center overflow-hidden max-h-[350px] p-2">
          <img 
            v-if="selectedOrder.payment_proof_url" 
            :src="selectedOrder.payment_proof_url" 
            class="object-contain max-h-[330px] border border-black filter grayscale" 
            alt="Payment slip receipt proof" 
          />
          <div v-else class="p-8 text-center text-gray-400 font-mono text-xs font-bold uppercase">
            NO PAYMENT SLIP SUBMITTED
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-4">
          <button 
            @click="handleVerifyPayment(false)"
            class="brutalist-button py-2.5 px-4 font-bold text-xs uppercase bg-white border-2 border-black hover:bg-[#CC0000] hover:text-white"
          >
            REJECT_PAYMENT
          </button>
          <button 
            @click="handleVerifyPayment(true)"
            class="brutalist-button-red bg-[#CC0000] py-2.5 px-4 font-bold text-xs uppercase text-white border-2 border-black hover:bg-black"
          >
            CONFIRM_PAYMENT
          </button>
        </div>
      </div>
    </Modal>

    <!-- ASSIGN COURIER MODAL -->
    <Modal 
      :show="showAssignModal" 
      title="FLEET_OPERATIVE_ASSIGNMENT" 
      @close="showAssignModal = false"
    >
      <div v-if="selectedOrder" class="flex flex-col gap-4">
        <p class="font-semibold text-black text-sm uppercase tracking-tight">
          Select courier operative to deliver <span class="bg-black text-white px-2 py-0.5">{{ selectedOrder.order_code }}</span>.
        </p>
        
        <div>
          <label class="block font-mono text-xs font-bold text-gray-500 uppercase mb-1">AVAILABLE_FLEET_UNITS</label>
          <select 
            v-model="selectedCourierId" 
            class="w-full border-2 border-black p-2 font-mono text-sm focus:bg-gray-50 outline-none uppercase font-bold"
          >
            <option v-for="c in activeCouriers" :key="c.id" :value="c.id">
              {{ c.name }} ({{ c.vehicle_type }})
            </option>
          </select>
        </div>

        <button 
          @click="handleAssignCourier"
          class="brutalist-button-red bg-[#CC0000] text-white hover:bg-black p-3 font-bold uppercase text-center border-2 border-black active:scale-95 transition-all text-xs"
        >
          CONFIRM_DISPATCH_ASSIGNMENT
        </button>
      </div>
    </Modal>

    <!-- CANCEL ORDER MODAL -->
    <Modal 
      :show="showCancelModal" 
      title="DELETION_ORDER_ALERT" 
      @close="showCancelModal = false"
    >
      <div v-if="selectedOrder">
        <p class="mb-4 font-semibold text-black">
          Are you sure you want to cancel order <span class="font-mono bg-black text-white px-1.5 py-0.5">{{ selectedOrder.order_code }}</span>?
        </p>
        <p class="text-xs text-[#CC0000] font-bold uppercase mb-6">
          🚨 WARNING: This action is irreversible and flags the transaction as cancelled.
        </p>
        <div class="flex justify-end gap-3">
          <button @click="showCancelModal = false" class="brutalist-button py-2 px-4 text-xs">DISMISS</button>
          <button @click="handleCancelOrder" class="brutalist-button-red py-2 px-4 text-xs">CANCEL_ORDER</button>
        </div>
      </div>
    </Modal>

  </div>
</template>
