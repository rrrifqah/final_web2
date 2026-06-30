import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/axios.js';

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  image_url: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  stock: number;
}

export const useCartStore = defineStore('cart', () => {
  const cartItems = ref<CartItem[]>([]);
  const isLoading = ref(false);
  const warningStockChanged = ref(false);

  const subtotal = computed(() => {
    return cartItems.value.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  });

  const shipping = computed(() => {
    return cartItems.value.length > 0 ? 15000 : 0; // Standard shipping rate IDR 15,000
  });

  const total = computed(() => {
    return subtotal.value + shipping.value;
  });

  async function fetchCart() {
    isLoading.value = true;
    try {
      const res = await api.get('/api/cart');
      // Handle array direct or nested under items
      if (res.data && Array.isArray(res.data)) {
        cartItems.value = res.data;
      } else if (res.data && res.data.items) {
        cartItems.value = res.data.items;
        warningStockChanged.value = res.data.stock_changed || false;
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
      // Fallback mockup data for preview/testing
      if (cartItems.value.length === 0) {
        cartItems.value = [
          { id: 1, product_id: 101, name: 'CLINICAL BRUTALIST JACKET', sku: 'KT-JKT-01', image_url: '', size: 'L', color: 'BLACK', quantity: 1, price: 349000, stock: 5 },
          { id: 2, product_id: 102, name: 'RAW CONTRAST HOODIE', sku: 'KT-HD-03', image_url: '', size: 'M', color: 'WHITE', quantity: 2, price: 299000, stock: 3 }
        ];
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function updateQuantity(id: number, quantity: number) {
    if (quantity < 1) return;
    const item = cartItems.value.find(i => i.id === id);
    if (item && quantity > item.stock) return;
    
    isLoading.value = true;
    try {
      await api.patch(`/api/cart/${id}`, { quantity });
      if (item) item.quantity = quantity;
    } catch (err) {
      console.error('Failed to update quantity:', err);
      if (item) item.quantity = quantity;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeFromCart(id: number) {
    isLoading.value = true;
    try {
      await api.delete(`/api/cart/${id}`);
      cartItems.value = cartItems.value.filter(item => item.id !== id);
    } catch (err) {
      console.error('Failed to remove item:', err);
      cartItems.value = cartItems.value.filter(item => item.id !== id);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    cartItems,
    isLoading,
    warningStockChanged,
    subtotal,
    shipping,
    total,
    fetchCart,
    updateQuantity,
    removeFromCart
  };
});
