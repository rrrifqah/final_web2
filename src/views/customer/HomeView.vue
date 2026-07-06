<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import api from '../../api/axios.js'
import ProductCard from '../../components/ProductCard.vue'

const router = useRouter()
const authStore = useAuthStore()

const featuredProducts = ref<any[]>([])
const categories = ref<any[]>([])
const isLoading = ref(true)

// Mock Data for offline robustness & visual excellence
const mockProducts = [
  { id: 1, name: 'BRUTALIST OVERCOAT', slug: 'brutalist-overcoat', sku: 'SKU-OVER-09', price: 1499000, image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80', variants: [{ id: 1, stock: 10, size: 'M', color: 'Black' }] },
  { id: 2, name: 'CLINICAL UTILITY VEST', slug: 'clinical-utility-vest', sku: 'SKU-VEST-44', price: 899000, image_url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80', variants: [{ id: 2, stock: 5, size: 'L', color: 'Gray' }] },
  { id: 3, name: 'ASYMMETRIC CARGO PANTS', slug: 'asymmetric-cargo-pants', sku: 'SKU-CARG-88', price: 950000, image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80', variants: [{ id: 3, stock: 0, size: 'S', color: 'Olive' }] },
  { id: 4, name: 'RAW EDGE SWEATSHIRT', slug: 'raw-edge-sweatshirt', sku: 'SKU-SWEA-21', price: 799000, image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80', variants: [{ id: 4, stock: 12, size: 'M', color: 'White' }] },
  { id: 5, name: 'MODULAR BACKPACK', slug: 'modular-backpack', sku: 'SKU-BACK-12', price: 1200000, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', variants: [{ id: 5, stock: 3, size: 'ONE', color: 'Black' }] },
  { id: 6, name: 'STRAP BOOTS HIGH-TOP', slug: 'strap-boots-high-top', sku: 'SKU-BOOT-07', price: 2199000, image_url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80', variants: [{ id: 6, stock: 8, size: '42', color: 'Black' }] },
  { id: 7, name: 'INDUSTRIAL BELT RED', slug: 'industrial-belt-red', sku: 'SKU-BELT-32', price: 350000, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', variants: [{ id: 7, stock: 2, size: 'ONE', color: 'Red' }] },
  { id: 8, name: 'HEAVYWEIGHT TEE BLACK', slug: 'heavyweight-tee-black', sku: 'SKU-TEEE-01', price: 450000, image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', variants: [{ id: 8, stock: 25, size: 'L', color: 'Black' }] }
]

const mockCategories = [
  { id: 1, name: 'Outerwear', slug: 'outerwear' },
  { id: 2, name: 'Tops', slug: 'tops' },
  { id: 3, name: 'Bottoms', slug: 'bottoms' }
]

const fetchData = async () => {
  isLoading.value = true
  
  // API Fetch for products
  try {
    const productsRes = await api.get('/products', { params: { featured: true, limit: 8 } })
    const data = productsRes.data?.data || productsRes.data
    featuredProducts.value = Array.isArray(data) && data.length > 0 ? data : []
  } catch (error) {
    console.error('Could not contact API for featured products:', error)
    featuredProducts.value = []
  }

  // API Fetch for categories
  try {
    const categoriesRes = await api.get('/categories')
    const data = categoriesRes.data?.data || categoriesRes.data
    categories.value = Array.isArray(data) && data.length > 0 ? data : []
  } catch (error) {
    console.error('Could not contact API for categories:', error)
    categories.value = []
  } finally {
    // Artificial 800ms delay to display the custom brutalist loading skeleton
    setTimeout(() => {
      isLoading.value = false
    }, 800)
  }
}

onMounted(() => {
  fetchData()
})

const handleCta = () => {
  if (authStore.isLoggedIn) {
    router.push('/catalog')
  } else {
    router.push('/login')
  }
}

const handleCategoryClick = (slug: string) => {
  router.push(`/catalog?category=${slug}`)
}
</script>

<template>
  <div class="space-y-12">
    
    <!-- Hero Section -->
    <section class="relative w-full h-[500px] md:h-[650px] border-4 border-black overflow-hidden flex items-center bg-black">
      
      <!-- Background Grayscale Image -->
      <div 
        class="absolute inset-0 bg-cover bg-center grayscale opacity-60 transition-all duration-700 hover:scale-105"
        style="background-image: url('https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80');"
      ></div>

      <!-- Semi-transparent Dark Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/25"></div>

      <!-- Core Hero Text & Action -->
      <div class="relative z-10 w-full px-6 md:px-12 flex flex-col items-start text-white space-y-6">
        <h1 class="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none select-none">
          WHITE EDITION<span class="text-[#CC0000]">.</span>
        </h1>
        
        <!-- CTA button -->
        <button 
          @click="handleCta" 
          class="px-8 py-4 bg-[#CC0000] text-white border-4 border-black font-black uppercase tracking-wider text-lg hover:bg-white hover:text-black transition-all active:scale-95 shadow-[4px_4px_0px_#000000]"
        >
          INITIATE_SESSION
        </button>
      </div>

      <!-- System Protocol Notice Box Overlay -->
      <div class="absolute bottom-6 right-6 md:right-12 md:bottom-12 z-10 max-w-sm border-4 border-black bg-white p-5 text-black shadow-[6px_6px_0px_#CC0000]">
        <h3 class="font-bold font-mono text-xs text-[#CC0000] tracking-widest mb-1">
          SYSTEM_PROTOCOL: ACTIVE
        </h3>
        <p class="text-sm font-medium tracking-tight">
          DIRECT DELIVERIES MANAGED BY IN-HOUSE DISPATCH PROTOCOLS. USE REDUCTION CODE <span class="font-mono bg-black text-white px-1 font-bold">KETCE2025</span> AT GATEWAY CHECKOUT FOR 20% DISCOUNT.
        </p>
      </div>

    </section>

    <!-- Featured Products Section -->
    <section>
      <div class="border-b-4 border-black pb-4 mb-8">
        <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black">
          FEATURED_PRODUCTS
        </h2>
      </div>

      <!-- Loading Skeleton Cards -->
      <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div 
          v-for="i in 8" 
          :key="i" 
          class="border-4 border-black p-4 bg-[#F9F9F9] animate-pulse space-y-4"
        >
          <div class="w-full aspect-square bg-gray-300 border-4 border-black"></div>
          <div class="h-6 bg-gray-300 w-3/4"></div>
          <div class="h-6 bg-gray-300 w-1/3"></div>
          <div class="h-10 bg-gray-300 w-full"></div>
        </div>
      </div>

      <!-- Product Cards Grid -->
      <div v-else-if="featuredProducts.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <ProductCard 
          v-for="product in featuredProducts" 
          :key="product.id" 
          :product="product" 
        />
      </div>

      <!-- Empty State -->
      <div v-else class="border-4 border-black bg-white py-16 px-4 flex flex-col items-center justify-center space-y-4 shadow-[6px_6px_0px_#CC0000] text-center">
        <div class="bg-[#CC0000] text-white border-2 border-black font-mono text-xs px-3 py-1 font-bold select-none tracking-widest uppercase">
          NO_DATA_AVAILABLE
        </div>
        <h2 class="text-2xl font-black uppercase tracking-tight text-black">
          NO FEATURED PRODUCTS FOUND.
        </h2>
        <p class="text-sm font-medium text-gray-500 max-w-md">
          The database is currently empty or unavailable. Please check backend connection.
        </p>
      </div>
    </section>

    <!-- Categories Section -->
    <section class="pb-8">
      <div class="border-b-4 border-black pb-4 mb-8">
        <h2 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black">
          CATEGORIES
        </h2>
      </div>

      <!-- Categories 3 Column Grid -->
      <div v-if="categories.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          v-for="category in categories" 
          :key="category.id"
          @click="handleCategoryClick(category.slug)"
          class="border-4 border-black p-10 bg-white text-black text-center cursor-pointer transition-all hover:bg-black hover:text-white hover:-translate-y-1 shadow-[6px_6px_0px_#CC0000] hover:shadow-none select-none flex flex-col items-center justify-center min-h-[160px]"
        >
          <span class="text-3xl font-black uppercase tracking-tight">
            {{ category.name }}
          </span>
          <span class="font-mono text-xs opacity-60 mt-2 hover:opacity-100">
            // OPEN_PROTOCOL_CATALOG
          </span>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="border-4 border-black bg-white py-16 px-4 flex flex-col items-center justify-center space-y-4 shadow-[6px_6px_0px_#CC0000] text-center">
        <div class="bg-[#CC0000] text-white border-2 border-black font-mono text-xs px-3 py-1 font-bold select-none tracking-widest uppercase">
          NO_CATEGORIES_AVAILABLE
        </div>
        <h2 class="text-2xl font-black uppercase tracking-tight text-black">
          NO CATEGORIES FOUND.
        </h2>
        <p class="text-sm font-medium text-gray-500 max-w-md">
          The database is currently empty or unavailable. Please check backend connection.
        </p>
      </div>
    </section>

  </div>
</template>
