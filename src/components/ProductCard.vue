<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useCartStore } from '../stores/cart.js'

const props = defineProps<{
  product: {
    id: number
    name: string
    slug: string
    sku: string
    price: number
    image_url?: string
    image?: string
    variants?: Array<{ id: number; stock: number; size: string; color: string }>
    [key: string]: any
  }
}>()

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const formattedPrice = computed(() => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(props.product.price)
})

const getProductImage = computed(() => {
  return props.product.image_url || props.product.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
})

const handleCardClick = () => {
  router.push('/product/' + props.product.slug)
}

const handleSecureOrder = async (event: Event) => {
  event.stopPropagation()
  
  if (!authStore.isLoggedIn) {
    localStorage.setItem('intended_url', `/product/${props.product.slug}`)
    router.push('/login')
    return
  }

  try {
    await cartStore.addToCart(props.product.id, 1)
    // Custom brutalist flash alert/toast
    showToast(`ADDED: ${props.product.name.toUpperCase()} TO CART`)
  } catch (error) {
    showToast('FAILED TO ADD TO CART')
  }
}

// Simple temporary toast alert implementation helper
const showToast = (message: string) => {
  const toast = document.createElement('div')
  toast.className = 'fixed bottom-8 right-8 bg-black text-white border-4 border-white font-mono text-sm px-6 py-4 z-50 shadow-[4px_4px_0px_#CC0000] uppercase tracking-wider'
  toast.innerText = message
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.remove()
  }, 3000)
}
</script>

<template>
  <div 
    @click="handleCardClick" 
    class="brutalist-card relative flex flex-col justify-between cursor-pointer p-4 group select-none hover:shadow-[8px_8px_0px_#000000]"
  >
    <!-- SKU Badge Top-Left -->
    <div class="absolute top-6 left-6 z-10 bg-black text-white text-xs font-mono px-2 py-1 uppercase tracking-wider border-2 border-white">
      {{ props.product.sku }}
    </div>

    <!-- Image Wrapper with Grayscale transition -->
    <div class="w-full aspect-square bg-gray-100 border-4 border-black overflow-hidden mb-4 relative">
      <img 
        :src="getProductImage" 
        :alt="props.product.name" 
        class="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
        loading="lazy"
      />
    </div>

    <!-- Product Text Information -->
    <div class="flex-grow flex flex-col justify-between mb-4">
      <h3 class="text-lg font-black uppercase tracking-tighter text-black line-clamp-2 mb-1">
        {{ props.product.name }}
      </h3>
      <span class="text-lg font-black text-[#CC0000] font-mono">
        {{ formattedPrice }}
      </span>
    </div>

    <!-- Secure Order Button -->
    <button 
      @click="handleSecureOrder" 
      class="w-full py-3 brutalist-button text-sm uppercase tracking-wider active:scale-95"
    >
      SECURE_ORDER
    </button>
  </div>
</template>
