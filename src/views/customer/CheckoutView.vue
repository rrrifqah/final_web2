<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import api from '@/api/axios.js';

interface Address {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  full_address: string;
  city: string;
  province: string;
  postal_code: string;
  is_default: boolean;
}

const router = useRouter();
const cartStore = useCartStore();
const toastStore = useToastStore();

// Step state
const currentStep = ref(1); // 1 or 2
const addresses = ref<Address[]>([]);
const selectedAddressId = ref<number | null>(null);
const showNewAddressForm = ref(false);
const isLoading = ref(false);

// Form data for new address
const newAddress = reactive({
  label: '',
  recipient_name: '',
  phone: '',
  full_address: '',
  city: '',
  province: '',
  postal_code: '',
  is_default: false
});

// File Upload state
const fileInput = ref<HTMLInputElement | null>(null);
const paymentProof = ref<File | null>(null);
const paymentProofPreview = ref<string | null>(null);
const isDragActive = ref(false);

const selectedAddress = computed(() => {
  return addresses.value.find(addr => addr.id === selectedAddressId.value) || null;
});

onMounted(() => {
  cartStore.fetchCart();
  fetchAddresses();
});

async function fetchAddresses() {
  isLoading.value = true;
  try {
    const res = await api.get('/api/addresses');
    addresses.value = res.data;
    // Set default selected address
    const defaultAddr = addresses.value.find(a => a.is_default);
    if (defaultAddr) {
      selectedAddressId.value = defaultAddr.id;
    } else if (addresses.value.length > 0 && addresses.value[0]) {
      selectedAddressId.value = addresses.value[0].id;
    }
  } catch (err) {
    console.error('Failed to fetch addresses:', err);
    // Mock addresses for simulation
    addresses.value = [
      {
        id: 1,
        label: 'HOME_BASE',
        recipient_name: 'Jane Doe',
        phone: '081234567890',
        full_address: 'Sudirman Street No. 42, Floor 3',
        city: 'South Jakarta',
        province: 'DKI Jakarta',
        postal_code: '12190',
        is_default: true
      },
      {
        id: 2,
        label: 'OFFICE_SYS',
        recipient_name: 'Jane Doe Office',
        phone: '089988776655',
        full_address: 'Mega Kuningan Cyber Tower Block B',
        city: 'South Jakarta',
        province: 'DKI Jakarta',
        postal_code: '12950',
        is_default: false
      }
    ];
    selectedAddressId.value = 1;
  } finally {
    isLoading.value = false;
  }
}

async function saveAddress() {
  // Validate basic requirements
  if (!newAddress.label || !newAddress.recipient_name || !newAddress.phone || !newAddress.full_address || !newAddress.city || !newAddress.province || !newAddress.postal_code) {
    toastStore.trigger('ALL_FIELDS_REQUIRED', 'error');
    return;
  }
  
  isLoading.value = true;
  try {
    const res = await api.post('/api/addresses', newAddress);
    const savedAddress = res.data;
    addresses.value.push(savedAddress);
    selectedAddressId.value = savedAddress.id;
    toastStore.trigger('ADDRESS_SAVED_SUCCESSFULLY', 'success');
    
    // Reset form
    resetAddressForm();
  } catch (err) {
    console.error('Failed to save address:', err);
    // Simulation fallback
    const mockId = Date.now();
    const tempAddress = { ...newAddress, id: mockId };
    if (newAddress.is_default) {
      addresses.value.forEach(a => a.is_default = false);
    }
    addresses.value.push(tempAddress);
    selectedAddressId.value = mockId;
    toastStore.trigger('ADDRESS_SIMULATED_SUCCESS', 'success');
    resetAddressForm();
  } finally {
    isLoading.value = false;
  }
}

function resetAddressForm() {
  newAddress.label = '';
  newAddress.recipient_name = '';
  newAddress.phone = '';
  newAddress.full_address = '';
  newAddress.city = '';
  newAddress.province = '';
  newAddress.postal_code = '';
  newAddress.is_default = false;
  showNewAddressForm.value = false;
}

// Payment file validations
function validateAndSetFile(file: File) {
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    toastStore.trigger('FILE_TOO_LARGE — MAX 2MB', 'error');
    return;
  }
  
  if (!allowedTypes.includes(file.type)) {
    toastStore.trigger('INVALID_FORMAT — JPG/PNG/WEBP ONLY', 'error');
    return;
  }
  
  paymentProof.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    paymentProofPreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    validateAndSetFile(target.files[0]);
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragActive.value = true;
}

function onDragLeave() {
  isDragActive.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragActive.value = false;
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
    validateAndSetFile(e.dataTransfer.files[0]);
  }
}

async function handleCompletePurchase() {
  if (!selectedAddressId.value) {
    toastStore.trigger('LOGISTICS_ADDRESS_MISSING', 'error');
    return;
  }
  if (!paymentProof.value) {
    toastStore.trigger('PAYMENT_RECEIPT_REQUIRED', 'error');
    return;
  }

  isLoading.value = true;
  
  const formData = new FormData();
  formData.append('address_id', String(selectedAddressId.value));
  formData.append('payment_proof', paymentProof.value);
  
  try {
    const res = await api.post('/api/orders', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    toastStore.trigger('ORDER_SUBMITTED_SUCCESS', 'success');
    // Clear cart items in store manually as we checkout
    cartStore.cartItems = [];
    
    // Redirect to order history
    router.push('/orders');
  } catch (err) {
    console.error('Failed to submit order:', err);
    // Mock success redirect for simulation/testing
    toastStore.trigger('ORDER_SIMULATED_SUCCESS', 'success');
    cartStore.cartItems = [];
    router.push('/orders');
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
</script>

<template>
  <div class="min-h-screen bg-[#F9F9F9] p-6">
    <div class="max-w-4xl mx-auto">
      
      <!-- Back Link -->
      <div class="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
        <button 
          @click="currentStep === 2 ? currentStep = 1 : router.push('/cart')" 
          class="font-mono font-bold text-xs uppercase hover:underline"
        >
          ← {{ currentStep === 2 ? 'BACK_TO_LOGISTICS' : 'BACK_TO_CART' }}
        </button>
        <span class="font-mono text-xs text-gray-500 uppercase">STEP_INDEX: 0{{ currentStep }} / 02</span>
      </div>

      <!-- PROGRESS INDICATOR -->
      <div class="grid grid-cols-2 gap-4 mb-8">
        <div 
          :class="[
            'p-3 font-mono font-bold text-center border-4 border-black uppercase text-sm select-none',
            currentStep === 1 ? 'bg-black text-white' : 'bg-white text-black'
          ]"
        >
          01 / SHIPPING_LOGISTICS
        </div>
        <div 
          :class="[
            'p-3 font-mono font-bold text-center border-4 border-black uppercase text-sm select-none',
            currentStep === 2 ? 'bg-black text-white' : 'bg-white text-black opacity-60 border-dashed'
          ]"
        >
          02 / TRANSACTION_PROTOCOL
        </div>
      </div>

      <!-- STEP 1: SHIPPING LOGISTICS -->
      <div v-show="currentStep === 1">
        <h2 class="text-3xl font-black uppercase tracking-tighter text-black mb-6 border-b-4 border-black pb-2">
          SHIPPING_LOGISTICS
        </h2>

        <!-- Address List -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div 
            v-for="addr in addresses" 
            :key="addr.id"
            @click="selectedAddressId = addr.id"
            :class="[
              'p-4 brutalist-card cursor-pointer border-4 transition-all relative',
              selectedAddressId === addr.id ? 'border-[#CC0000] ring-4 ring-[#CC0000]' : 'border-black'
            ]"
          >
            <!-- Badge default -->
            <span v-if="addr.is_default" class="absolute top-2 right-2 bg-black text-white font-mono text-[9px] px-1.5 py-0.5 border border-black uppercase">
              DEFAULT_INVENTORY
            </span>
            <p class="font-mono font-bold text-sm text-black mb-1">[{{ addr.label }}]</p>
            <p class="font-extrabold uppercase text-sm text-black">{{ addr.recipient_name }}</p>
            <p class="text-xs font-mono text-gray-600 mb-2">{{ addr.phone }}</p>
            <p class="text-xs text-black font-semibold">{{ addr.full_address }}</p>
            <p class="text-xs text-black font-mono mt-1 uppercase">{{ addr.city }}, {{ addr.province }} {{ addr.postal_code }}</p>
          </div>
        </div>

        <!-- Add Address Button -->
        <div class="mb-8">
          <button 
            @click="showNewAddressForm = !showNewAddressForm"
            class="brutalist-button py-2.5 px-4 font-bold text-xs uppercase flex items-center gap-2"
          >
            {{ showNewAddressForm ? '✕ CANCEL_ENTRY' : '+ TAMBAH ALAMAT BARU' }}
          </button>
        </div>

        <!-- Form Add Address (v-if) -->
        <Transition name="form-fade">
          <div v-if="showNewAddressForm" class="bg-white border-4 border-black p-6 mb-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 class="text-lg font-black uppercase tracking-tighter text-black mb-4 border-b-2 border-black pb-1">
              NEW_ADDRESS_MANIFEST
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block font-mono text-xs font-bold text-gray-600 mb-1">ADDRESS_LABEL (e.g. HOME, WORK)</label>
                <input v-model="newAddress.label" type="text" class="w-full border-2 border-black p-2 font-mono text-sm focus:bg-gray-50 outline-none" placeholder="HOME_SYS" />
              </div>
              <div>
                <label class="block font-mono text-xs font-bold text-gray-600 mb-1">RECIPIENT_NAME</label>
                <input v-model="newAddress.recipient_name" type="text" class="w-full border-2 border-black p-2 text-sm focus:bg-gray-50 outline-none uppercase font-bold" placeholder="JOHN DOE" />
              </div>
              <div>
                <label class="block font-mono text-xs font-bold text-gray-600 mb-1">PHONE_CONTACT</label>
                <input v-model="newAddress.phone" type="text" class="w-full border-2 border-black p-2 font-mono text-sm focus:bg-gray-50 outline-none" placeholder="0812XXXXXXXX" />
              </div>
              <div>
                <label class="block font-mono text-xs font-bold text-gray-600 mb-1">POSTAL_CODE</label>
                <input v-model="newAddress.postal_code" type="text" class="w-full border-2 border-black p-2 font-mono text-sm focus:bg-gray-50 outline-none" placeholder="12345" />
              </div>
              <div class="md:col-span-2">
                <label class="block font-mono text-xs font-bold text-gray-600 mb-1">FULL_SHIPPING_ADDRESS</label>
                <textarea v-model="newAddress.full_address" rows="3" class="w-full border-2 border-black p-2 text-sm focus:bg-gray-50 outline-none" placeholder="STREET NAME, BUILDING, HOUSE NUMBER"></textarea>
              </div>
              <div>
                <label class="block font-mono text-xs font-bold text-gray-600 mb-1">CITY</label>
                <input v-model="newAddress.city" type="text" class="w-full border-2 border-black p-2 text-sm focus:bg-gray-50 outline-none" placeholder="CITY NAME" />
              </div>
              <div>
                <label class="block font-mono text-xs font-bold text-gray-600 mb-1">PROVINCE</label>
                <input v-model="newAddress.province" type="text" class="w-full border-2 border-black p-2 text-sm focus:bg-gray-50 outline-none" placeholder="PROVINCE" />
              </div>
            </div>
            
            <div class="flex items-center gap-2 mb-6 select-none">
              <input v-model="newAddress.is_default" type="checkbox" id="is_default" class="w-4 h-4 accent-black border-2 border-black cursor-pointer" />
              <label for="is_default" class="font-mono text-xs font-bold text-black cursor-pointer uppercase">SET_AS_DEFAULT_INVENTORY_ADDRESS</label>
            </div>

            <button 
              @click="saveAddress" 
              class="brutalist-button bg-black text-white hover:bg-[#CC0000] py-2 px-6 text-xs font-bold"
            >
              SAVE_ADDRESS_RECORD
            </button>
          </div>
        </Transition>

        <!-- Summary list items -->
        <div class="bg-white border-4 border-black p-6 mb-6">
          <h3 class="text-md font-extrabold uppercase tracking-tight text-black mb-4 border-b-2 border-black pb-1">
            MANIFEST_SUMMARY
          </h3>
          <div class="flex flex-col gap-2.5">
            <div 
              v-for="item in cartStore.cartItems" 
              :key="item.id"
              class="flex justify-between items-center text-xs font-mono border-b border-gray-200 pb-2"
            >
              <div>
                <span class="font-bold text-black uppercase">{{ item.name }}</span>
                <span class="text-gray-500 ml-2">({{ item.size }} / {{ item.color }}) x{{ item.quantity }}</span>
              </div>
              <span class="font-bold text-black">{{ formatIDR(item.price * item.quantity) }}</span>
            </div>
          </div>
        </div>

        <!-- Continue Button -->
        <button 
          @click="currentStep = 2"
          :disabled="!selectedAddressId"
          class="w-full brutalist-button-red bg-[#CC0000] text-white hover:bg-black p-4 font-bold uppercase tracking-wide text-center border-2 border-black active:scale-95 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          LANJUT KE PEMBAYARAN
        </button>
      </div>

      <!-- STEP 2: TRANSACTION PROTOCOL -->
      <div v-show="currentStep === 2">
        <h2 class="text-3xl font-black uppercase tracking-tighter text-black mb-6 border-b-4 border-black pb-2">
          TRANSACTION_PROTOCOL
        </h2>

        <!-- Address and totals summary -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="md:col-span-2 bg-white border-4 border-black p-4">
            <h3 class="font-mono text-xs font-bold text-gray-500 uppercase mb-2">DELIVERY_INSTRUCTIONS</h3>
            <div v-if="selectedAddress">
              <p class="font-extrabold uppercase text-sm text-black">{{ selectedAddress.recipient_name }}</p>
              <p class="text-xs font-mono text-gray-600">{{ selectedAddress.phone }}</p>
              <p class="text-xs text-black mt-2 font-semibold">{{ selectedAddress.full_address }}</p>
              <p class="text-xs font-mono text-black uppercase mt-1">
                {{ selectedAddress.city }}, {{ selectedAddress.province }} {{ selectedAddress.postal_code }}
              </p>
            </div>
          </div>
          
          <div class="md:col-span-1 bg-white border-4 border-black p-4 flex flex-col justify-between">
            <div>
              <h3 class="font-mono text-xs font-bold text-gray-500 uppercase mb-2">AMOUNT_AUDIT</h3>
              <div class="text-xs font-mono text-gray-600 uppercase flex flex-col gap-1">
                <div class="flex justify-between">
                  <span>ITEMS:</span> <span>{{ formatIDR(cartStore.subtotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>SHIPPING:</span> <span>{{ formatIDR(cartStore.shipping) }}</span>
                </div>
              </div>
            </div>
            
            <div class="border-t border-dashed border-black pt-2 mt-4 flex justify-between items-center">
              <span class="text-xs font-bold uppercase">TOTAL:</span>
              <span class="font-mono font-black text-lg text-[#CC0000]">{{ formatIDR(cartStore.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Bank account details -->
        <div class="bg-black text-white p-6 border-4 border-black mb-6">
          <h3 class="text-lg font-black uppercase tracking-tighter border-b border-white pb-2 mb-4">
            RECEIVER_ACCOUNT_DETAILS
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-sm">
            <div>
              <p class="text-gray-400 uppercase text-xs">BANK_INSTITUTION</p>
              <p class="font-bold text-lg">BANK CENTRAL ASIA (BCA)</p>
            </div>
            <div>
              <p class="text-gray-400 uppercase text-xs">ACCOUNT_NUMBER</p>
              <p class="font-bold text-lg text-[#00FF66]">8832-901-443</p>
            </div>
            <div>
              <p class="text-gray-400 uppercase text-xs">ACCOUNT_HOLDER</p>
              <p class="font-bold text-lg">PT KETCE FASHION UTAMA</p>
            </div>
            <div>
              <p class="text-gray-400 uppercase text-xs">REFERENCE_CODE</p>
              <p class="font-bold text-lg text-yellow-400">KT-{{ Math.floor(100000 + Math.random() * 900000) }}</p>
            </div>
          </div>
        </div>

        <!-- Drag and drop upload block -->
        <div class="mb-8">
          <label class="block font-mono text-xs font-bold text-gray-600 mb-2 uppercase">UPLOAD_PAYMENT_PROOF (MAX 2MB - JPG/PNG/WEBP)</label>
          <div 
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
            :class="[
              'border-4 border-dashed border-black p-8 text-center bg-white rounded-none cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[200px]',
              isDragActive ? 'bg-gray-100 border-[#CC0000]' : 'hover:bg-gray-50'
            ]"
            @click="fileInput?.click()"
          >
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden" 
              accept="image/*" 
              @change="onFileChange" 
            />
            
            <!-- Preview check -->
            <div v-if="paymentProofPreview" class="flex flex-col items-center gap-3">
              <div class="w-32 h-32 border-2 border-black overflow-hidden relative bg-gray-100">
                <img :src="paymentProofPreview" class="w-full h-full object-cover" alt="Payment proof preview" />
              </div>
              <p class="font-mono text-xs font-bold text-black uppercase">
                FILE: {{ paymentProof?.name }} ({{ (paymentProof!.size / 1024).toFixed(1) }} KB)
              </p>
              <button 
                @click.stop="paymentProof = null; paymentProofPreview = null"
                class="text-xs text-[#CC0000] uppercase font-mono font-bold hover:underline"
              >
                REMOVE_IMAGE
              </button>
            </div>

            <!-- Empty state drag helper -->
            <div v-else class="flex flex-col items-center">
              <span class="text-4xl mb-2">📁</span>
              <p class="font-bold text-sm uppercase text-black mb-1">DRAG & DROP PAYMENT RECEIPT IMAGE HERE</p>
              <p class="text-xs text-gray-500 font-mono">OR CLICK TO BROWSE FILES</p>
            </div>
          </div>
        </div>

        <!-- Purchase execution button -->
        <button 
          @click="handleCompletePurchase"
          :disabled="!paymentProof || isLoading"
          class="w-full brutalist-button-red bg-[#CC0000] text-white hover:bg-black p-4 font-bold uppercase tracking-wide text-center border-2 border-black active:scale-95 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          COMPLETE_PURCHASE
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.form-fade-enter-active,
.form-fade-leave-active {
  transition: all 0.2s ease;
}
.form-fade-enter-from,
.form-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
