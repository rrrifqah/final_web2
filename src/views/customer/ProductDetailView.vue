<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/axios.js'
import { useAuthStore } from '../../stores/auth.js'
import { useCartStore } from '../../stores/cart.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const product = ref<any>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

// Local selection state matching specifications
const selectedColor = ref<string | null>(null)
const selectedSize = ref<string | null>(null)
const quantity = ref(1)
const activeImage = ref<string>('')

// Mock Data details
const mockProductDetails: Record<string, any> = {
  'brutalist-overcoat': {
    name: 'BRUTALIST OVERCOAT',
    sku: 'SKU-OVER-09',
    price: 1499000,
    description: 'Heavyweight felted wool overcoat designed for harsh clinical brutalist environments. Double-breasted closure, raw edge detailing, and oversized silhouette. Engineered to resist elements while maintaining structural posture.',
    specs: { material: 'Felted Wool 100%', category: 'Outerwear', origin: 'SECTOR_04' },
    images: [
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { id: 101, color: 'Black', size: 'S', stock: 0 },
      { id: 102, color: 'Black', size: 'M', stock: 8 },
      { id: 103, color: 'Black', size: 'L', stock: 4 },
      { id: 104, color: 'Gray', size: 'M', stock: 2 },
      { id: 105, color: 'Gray', size: 'L', stock: 12 }
    ]
  },
  'clinical-utility-vest': {
    name: 'CLINICAL UTILITY VEST',
    sku: 'SKU-VEST-44',
    price: 899000,
    description: 'High-density nylon utility vest featuring multi-pocket layout, adjustable industrial strap buckles, and integrated tactical attachment points. Clinical white line accents.',
    specs: { material: 'Nylon Cordura', category: 'Outerwear', origin: 'SECTOR_09' },
    images: [
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { id: 201, color: 'Gray', size: 'S', stock: 1 },
      { id: 202, color: 'Gray', size: 'M', stock: 0 },
      { id: 203, color: 'Gray', size: 'L', stock: 7 },
      { id: 204, color: 'Olive', size: 'M', stock: 4 }
    ]
  },
  'asymmetric-cargo-pants': {
    name: 'ASYMMETRIC CARGO PANTS',
    sku: 'SKU-CARG-88',
    price: 950000,
    description: 'Relaxed fit industrial cargo trousers featuring asymmetric pockets, raw cotton webbing straps, and ankle cinch closures. Structured clinical stitching.',
    specs: { material: 'Cotton Ripstop', category: 'Bottoms', origin: 'SECTOR_01' },
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
    ],
    variants: [
      { id: 301, color: 'Olive', size: 'S', stock: 0 },
      { id: 302, color: 'Olive', size: 'M', stock: 0 },
      { id: 303, color: 'Black', size: 'S', stock: 0 },
      { id: 304, color: 'Black', size: 'M', stock: 0 }
    ]
  }
}

// Master list reference from home
const mockCatalogProducts = [
  { id: 1, name: 'BRUTALIST OVERCOAT', slug: 'brutalist-overcoat', sku: 'SKU-OVER-09', price: 1499000, category: 'outerwear', image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'CLINICAL UTILITY VEST', slug: 'clinical-utility-vest', sku: 'SKU-VEST-44', price: 899000, category: 'outerwear', image_url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'ASYMMETRIC CARGO PANTS', slug: 'asymmetric-cargo-pants', sku: 'SKU-CARG-88', price: 950000, category: 'bottoms', image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80' },
  { id: 4, name: 'RAW EDGE SWEATSHIRT', slug: 'raw-edge-sweatshirt', sku: 'SKU-SWEA-21', price: 799000, category: 'tops', image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80' },
  { id: 5, name: 'MODULAR BACKPACK', slug: 'modular-backpack', sku: 'SKU-BACK-12', price: 1200000, category: 'accessories', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
  { id: 6, name: 'STRAP BOOTS HIGH-TOP', slug: 'strap-boots-high-top', sku: 'SKU-BOOT-07', price: 2199000, category: 'shoes', image_url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80' },
  { id: 7, name: 'INDUSTRIAL BELT RED', slug: 'industrial-belt-red', sku: 'SKU-BELT-32', price: 350000, category: 'accessories', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
  { id: 8, name: 'HEAVYWEIGHT TEE BLACK', slug: 'heavyweight-tee-black', sku: 'SKU-TEEE-01', price: 450000, category: 'tops', image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' }
]

// Available colors list computed from variants
const availableColors = computed(() => {
  if (!product.value?.variants) return []
  const colors = product.value.variants.map((v: any) => v.color)
  return [...new Set(colors)] as string[]
})

// Available sizes filtered by selected color
const availableSizes = computed(() => {
  if (!product.value?.variants || !selectedColor.value) return []
  return product.value.variants
    .filter((v: any) => v.color === selectedColor.value)
    .map((v: any) => ({ name: v.size, stock: v.stock }))
})

// Varian terpilih berdasarkan color + size
const selectedVariant = computed(() => {
  if (!product.value?.variants || !selectedColor.value || !selectedSize.value) return null
  return product.value.variants.find(
    (v: any) => v.color === selectedColor.value && v.size === selectedSize.value
  ) || null
})

// Max stock quantity
const maxQty = computed(() => selectedVariant.value?.stock ?? 0)

// Price formatter
const formattedPrice = computed(() => {
  if (!product.value) return ''
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(product.value.price)
})

const selectColor = (color: string) => {
  selectedColor.value = color
  selectedSize.value = null // reset size
  quantity.value = 1 // reset qty
}

const selectSize = (sizeName: string) => {
  selectedSize.value = sizeName
  quantity.value = 1 // reset qty
}

const incrementQty = () => {
  if (quantity.value < maxQty.value) {
    quantity.value++
  }
}

const decrementQty = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// Load product details
const loadProductDetail = async () => {
  isLoading.value = true
  const slug = route.params.slug as string
  
  try {
    const response = await api.get(`/products/${slug}`)
    product.value = response.data.data || response.data
  } catch (error) {
    console.warn(`Failed fetching API for product detail of ${slug}, loading mock database fallback:`, error)
    
    const details = mockProductDetails[slug]
    if (details) {
      product.value = details
    } else {
      // Dynamic details generation for remaining categories
      const basic = mockCatalogProducts.find(p => p.slug === slug) || mockCatalogProducts[0]!
      product.value = {
        name: basic.name,
        sku: basic.sku,
        price: basic.price,
        description: `Industrial high-contrast ${basic.name.toLowerCase()} styled for clinical-brutalist wardrobes. Heavyweight build featuring raw elements and premium accents.`,
        specs: { material: 'Industrial Canvas 100%', category: basic.category.toUpperCase(), origin: 'SECTOR_02' },
        images: [
          basic.image_url,
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'
        ],
        variants: [
          { id: basic.id * 100 + 1, color: 'Black', size: 'S', stock: 2 },
          { id: basic.id * 100 + 2, color: 'Black', size: 'M', stock: 12 },
          { id: basic.id * 100 + 3, color: 'Black', size: 'L', stock: 0 },
          { id: basic.id * 100 + 4, color: 'White', size: 'M', stock: 4 },
          { id: basic.id * 100 + 5, color: 'White', size: 'L', stock: 1 }
        ]
      }
    }
  } finally {
    if (product.value) {
      activeImage.value = product.value.images?.[0] || product.value.image_url || product.value.image
      
      // Auto select first color
      if (availableColors.value.length > 0) {
        selectedColor.value = availableColors.value[0] || null
      }
    }
    setTimeout(() => {
      isLoading.value = false
    }, 400)
  }
}

onMounted(() => {
  loadProductDetail()
})

const handleAddToCart = async () => {
  if (!selectedVariant.value) return

  if (!authStore.isLoggedIn) {
    localStorage.setItem('intended_url', `/product/${route.params.slug}`)
    router.push('/login')
    return
  }

  isSubmitting.value = true
  try {
    await cartStore.addToCart(selectedVariant.value.id, quantity.value)
    showToast(`SUCCESS: ADDED x${quantity.value} ITEM(S) TO PIPELINE`)
    
    // Reset inputs
    quantity.value = 1
  } catch (error) {
    showToast('CRITICAL: CART SUBMISSION PROCESS FAILED')
  } finally {
    isSubmitting.value = false
  }
}

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
  <div class="space-y-6">
    
    <!-- Skeleton Loader Detail Page -->
    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-12 py-8 animate-pulse">
      <div class="space-y-4">
        <div class="w-full aspect-square bg-gray-300 border-4 border-black"></div>
        <div class="flex gap-2">
          <div v-for="i in 3" :key="i" class="w-20 h-20 bg-gray-300 border-2 border-black"></div>
        </div>
      </div>
      <div class="space-y-6">
        <div class="h-4 bg-gray-300 w-1/4"></div>
        <div class="h-10 bg-gray-300 w-3/4"></div>
        <div class="h-8 bg-gray-300 w-1/3"></div>
        <div class="h-24 bg-gray-300 w-full"></div>
      </div>
    </div>

    <div v-else-if="product" class="space-y-6">
      
      <!-- Breadcrumb Navigation -->
      <nav class="font-mono text-xs uppercase tracking-wider py-2 bg-[#F9F9F9] px-4 border-2 border-black flex items-center space-x-2 select-none">
        <router-link to="/" class="hover:text-[#CC0000]">> HOME</router-link>
        <span>/</span>
        <router-link to="/catalog" class="hover:text-[#CC0000]">CATALOG</router-link>
        <span>/</span>
        <span class="text-gray-500 font-bold">{{ product.name }}</span>
      </nav>

      <!-- Main Two Column Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
        
        <!-- ================= KIRI: GALLERY ================= -->
        <div class="md:col-span-6 space-y-4">
          <!-- Main Big Image -->
          <div class="w-full aspect-square bg-[#F9F9F9] border-4 border-black overflow-hidden relative">
            <img 
              :src="activeImage" 
              :alt="product.name" 
              class="w-full h-full object-cover grayscale transition-all duration-300 hover:grayscale-0"
            />
          </div>

          <!-- Thumbnail List -->
          <div v-if="product.images && product.images.length > 1" class="flex flex-wrap gap-3">
            <button 
              v-for="(img, idx) in product.images" 
              :key="idx"
              @click="activeImage = img"
              class="w-20 h-20 border-4 transition-all relative overflow-hidden active:scale-95 bg-white"
              :class="activeImage === img ? 'border-[#CC0000] ring-2 ring-[#CC0000]' : 'border-black hover:border-gray-600'"
            >
              <img :src="img" :alt="idx.toString()" class="w-full h-full object-cover grayscale" />
            </button>
          </div>
        </div>

        <!-- ================= KANAN: DETAILS INFO ================= -->
        <div class="md:col-span-6 space-y-6">
          
          <!-- Monospace SKU Label -->
          <div class="font-mono text-xs font-bold text-gray-500 tracking-widest uppercase">
            SKU: {{ product.sku }}
          </div>

          <!-- Title -->
          <h1 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black select-none leading-none">
            {{ product.name }}
          </h1>

          <!-- Price -->
          <div class="text-2xl md:text-3xl font-black text-[#CC0000] font-mono border-y-4 border-black py-3 select-none bg-[#F9F9F9] px-4">
            {{ formattedPrice }}
          </div>

          <!-- Description -->
          <p class="text-sm font-medium text-black leading-relaxed">
            {{ product.description }}
          </p>

          <!-- Specifications Table Box -->
          <div class="border-4 border-black p-4 bg-[#F9F9F9] space-y-2 font-mono text-xs">
            <h3 class="font-bold border-b-2 border-black pb-1 mb-2">SYSTEM_PARAMETERS</h3>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <p class="text-gray-500 font-bold">MATERIAL:</p>
                <p class="font-black text-black">{{ product.specs?.material || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-gray-500 font-bold">CATEGORY:</p>
                <p class="font-black text-black">{{ product.specs?.category || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-gray-500 font-bold">ORIGIN:</p>
                <p class="font-black text-black">{{ product.specs?.origin || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Pilihan WARNA -->
          <div class="space-y-2">
            <h3 class="font-bold font-mono text-xs text-gray-500 uppercase tracking-widest">
              SELECT_COLOR
            </h3>
            <div class="flex flex-wrap gap-3">
              <button 
                v-for="color in availableColors" 
                :key="color"
                @click="selectColor(color)"
                class="px-4 py-2 border-4 border-black font-black uppercase text-xs transition-all active:scale-95 bg-white text-black"
                :class="selectedColor === color ? 'border-red-600 ring-2 ring-red-600 ring-offset-2 bg-black text-white' : 'hover:bg-gray-100'"
              >
                {{ color }}
              </button>
            </div>
          </div>

          <!-- Pilihan UKURAN -->
          <div v-if="selectedColor" class="space-y-2">
            <h3 class="font-bold font-mono text-xs text-gray-500 uppercase tracking-widest">
              SELECT_SIZE
            </h3>
            <div class="flex flex-wrap gap-3">
              <button 
                v-for="size in availableSizes" 
                :key="size.name"
                :disabled="size.stock === 0"
                @click="selectSize(size.name)"
                class="px-4 py-2 border-4 border-black font-mono font-black text-xs transition-all active:scale-95"
                :class="[
                  selectedSize === size.name 
                    ? 'border-red-600 ring-2 ring-red-600 ring-offset-2 bg-black text-white' 
                    : size.stock === 0 
                      ? 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400' 
                      : 'bg-white text-black hover:bg-gray-100',
                  size.stock <= 5 && size.stock > 0 ? 'text-[#CC0000]' : ''
                ]"
              >
                {{ size.name }}
                <span v-if="size.stock === 0"> (HABIS)</span>
                <span v-else-if="size.stock <= 5"> (TERBATAS)</span>
              </button>
            </div>
          </div>

          <!-- Quantity Selector & Action Button -->
          <div v-if="selectedVariant" class="space-y-4 border-t-4 border-black pt-6">
            
            <div class="flex items-center space-x-6">
              <span class="font-bold font-mono text-xs text-gray-500 uppercase tracking-widest">
                QUANTITY
              </span>
              
              <!-- Selector -->
              <div class="flex items-center border-4 border-black h-12 bg-white">
                <button 
                  @click="decrementQty" 
                  :disabled="quantity <= 1"
                  class="w-10 h-full font-black text-lg flex items-center justify-center border-r-4 border-black hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input 
                  type="number" 
                  v-model.number="quantity" 
                  readonly
                  class="w-12 h-full text-center font-mono font-black text-sm border-0 focus:ring-0"
                />
                <button 
                  @click="incrementQty" 
                  :disabled="quantity >= maxQty"
                  class="w-10 h-full font-black text-lg flex items-center justify-center border-l-4 border-black hover:bg-gray-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>

              <!-- Available Stock badge info -->
              <span class="font-mono text-xs text-gray-500 font-bold select-none">
                AVAILABLE_PIPELINE: {{ maxQty }} UNITS
              </span>
            </div>

            <!-- Submit Button Labeled TAMBAH KE CART -->
            <button 
              @click="handleAddToCart"
              :disabled="!selectedVariant || isSubmitting"
              class="w-full py-4 brutalist-button text-base uppercase active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none flex items-center justify-center space-x-2"
            >
              <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isSubmitting ? 'PROCESSING_DISPATCH...' : 'TAMBAH KE CART' }}</span>
            </button>

          </div>

          <div v-else class="p-4 border-4 border-[#CC0000] bg-red-50 text-[#CC0000] font-mono text-xs font-bold uppercase tracking-wider select-none shadow-[4px_4px_0px_#000000]">
            WARNING: SELECT BOTH COLOR AND SIZE PARAMETERS ABOVE TO INITIATE PURCHASE PROTOCOL.
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
