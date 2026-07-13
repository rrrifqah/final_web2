<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { useToastStore } from '@/stores/toast';
import Modal from '@/components/shared/Modal.vue';

const router = useRouter();
const cartStore = useCartStore();
const toastStore = useToastStore();

const showDeleteConfirm = ref(false);
const itemToDelete = ref<number | null>(null);

onMounted(() => {
  cartStore.fetchCart();
});

function confirmRemove(id: number) {
  itemToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function handleDelete() {
  if (itemToDelete.value !== null) {
    await cartStore.removeFromCart(itemToDelete.value);
    toastStore.trigger('ITEM_REMOVED_FROM_MANIFEST', 'success');
    showDeleteConfirm.value = false;
    itemToDelete.value = null;
  }
}

function handleCheckout() {
  if (cartStore.cartItems.length === 0) {
    toastStore.trigger('MANIFEST_IS_EMPTY', 'error');
    return;
  }
  router.push('/checkout');
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
    <div class="max-w-6xl mx-auto">
      <!-- Nav Header / Return link simulating customer shell -->
      <div class="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
        <router-link to="/auth" class="font-mono font-bold text-xs uppercase hover:underline">
          ← BACK_TO_PORTAL
        </router-link>
        <span class="font-mono text-xs text-gray-500 uppercase">SYS_REF: CUSTOMER_CART</span>
      </div>

      <!-- Title -->
      <h1 class="text-4xl font-extrabold uppercase tracking-tighter text-black mb-8 border-b-4 border-black pb-2">
        CART_MANIFEST
      </h1>

      <!-- Warning Stok -->
      <div 
        v-if="cartStore.warningStockChanged" 
        class="border-4 border-[#CC0000] bg-red-50 text-[#CC0000] p-4 mb-6 font-mono font-bold uppercase text-sm"
      >
        ⚠️ WARNING: SKU_QUANTITY_ADJUSTED — stock availability has fluctuated since manifest initialization.
      </div>

      <!-- Empty State -->
      <div 
        v-if="cartStore.cartItems.length === 0" 
        class="border-4 border-black p-12 text-center bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <p class="text-2xl font-black tracking-tighter uppercase text-black mb-4">MANIFEST_EMPTY</p>
        <p class="text-mono text-gray-500 mb-6 text-sm">NO ACTIVE ITEMS REGISTERED IN CUSTOMER INVENTORY</p>
        <button
          @click="router.push('/catalog')"
          class="brutalist-button bg-black text-white hover:bg-white hover:text-black font-bold uppercase px-8 py-3 active:scale-95 transition-all text-sm"
        >
          GO_TO_CATALOG
        </button>
      </div>

      <!-- Main Layout -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <!-- Cart Items List (2/3 width) -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <div 
            v-for="item in cartStore.cartItems" 
            :key="item.id" 
            class="bg-white border-4 border-black p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <!-- Grayscale Image -->
            <div class="w-20 h-20 border-2 border-black flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
              <img 
                v-if="item.image_url" 
                :src="item.image_url" 
                :alt="item.name" 
                class="w-full h-full object-cover filter grayscale"
              />
              <span v-else class="text-xs font-mono font-bold text-gray-400">NO_IMG</span>
            </div>

            <!-- Product Specs -->
            <div class="flex-grow">
              <h3 class="font-extrabold uppercase tracking-tight text-lg text-black">{{ item.name }}</h3>
              <p class="font-mono text-xs text-gray-500 uppercase tracking-tighter mt-0.5">SKU: {{ item.sku }}</p>
              <div class="flex gap-4 mt-2 text-xs font-bold font-mono">
                <span class="bg-gray-100 px-2 py-0.5 border border-black uppercase">SIZE: {{ item.size }}</span>
                <span class="bg-gray-100 px-2 py-0.5 border border-black uppercase">COLOR: {{ item.color }}</span>
              </div>
            </div>

            <!-- Quantity Controls -->
            <div class="flex items-center gap-2 border-2 border-black">
              <button 
                @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
                :disabled="item.quantity <= 1 || cartStore.isLoading"
                class="w-8 h-8 font-bold text-black border-r-2 border-black hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 select-none"
              >
                -
              </button>
              <span class="w-10 text-center font-mono font-bold text-sm">{{ item.quantity }}</span>
              <button 
                @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
                :disabled="item.quantity >= item.stock || cartStore.isLoading"
                class="w-8 h-8 font-bold text-black border-l-2 border-black hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 select-none"
              >
                +
              </button>
            </div>

            <!-- Price & Subtotal -->
            <div class="text-right flex flex-col items-end sm:pr-8">
              <p class="font-mono font-bold text-[#CC0000] text-sm">{{ formatIDR(item.price) }} / item</p>
              <p class="font-mono font-bold text-black text-lg mt-0.5">SUM: {{ formatIDR(item.price * item.quantity) }}</p>
            </div>

            <!-- Close (✕) button -->
            <button 
              @click="confirmRemove(item.id)"
              class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center border-2 border-black font-mono hover:bg-[#CC0000] hover:text-white transition-all active:scale-95"
              aria-label="Remove item"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Sticky Right Summary (1/3 width) -->
        <div class="lg:col-span-1 bg-white border-4 border-black p-6 sticky top-24 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 class="text-xl font-extrabold uppercase tracking-tighter text-black border-b-4 border-black pb-2 mb-4">
            SUMMARY_AUDIT
          </h2>
          
          <div class="flex flex-col gap-3 font-mono text-sm border-b-2 border-dashed border-black pb-4 mb-4">
            <div class="flex justify-between">
              <span class="text-gray-500 uppercase">SUBTOTAL:</span>
              <span class="font-bold text-black">{{ formatIDR(cartStore.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 uppercase">SHIPPING (ONKIR):</span>
              <span class="font-bold text-black">{{ formatIDR(cartStore.shipping) }}</span>
            </div>
          </div>

          <div class="flex justify-between items-center mb-6">
            <span class="font-bold text-black uppercase tracking-tight text-sm">TOTAL_PAYABLE:</span>
            <span class="font-black text-2xl text-[#CC0000] font-mono">{{ formatIDR(cartStore.total) }}</span>
          </div>

          <button 
            @click="handleCheckout"
            :disabled="cartStore.isLoading"
            class="w-full brutalist-button-red bg-[#CC0000] text-white hover:bg-black p-3.5 font-bold uppercase text-center border-2 border-black active:scale-95 transition-all text-sm"
          >
            PROCEED_CHECKOUT
          </button>
        </div>

      </div>
    </div>

    <!-- Confirm Remove Modal -->
    <Modal 
      :show="showDeleteConfirm" 
      title="DELETION_ALERT" 
      @close="showDeleteConfirm = false"
    >
      <p class="mb-6 font-medium text-black">Are you sure you want to remove this SKU item from your current shopping cart manifest?</p>
      <div class="flex justify-end gap-3">
        <button 
          @click="showDeleteConfirm = false" 
          class="brutalist-button py-2 px-4 text-xs"
        >
          CANCEL
        </button>
        <button 
          @click="handleDelete" 
          class="brutalist-button-red py-2 px-4 text-xs"
        >
          CONFIRM_REMOVE
        </button>
      </div>
    </Modal>
  </div>
</template>
