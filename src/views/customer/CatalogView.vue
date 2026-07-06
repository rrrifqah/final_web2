<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../api/axios.js'
import ProductCard from '../../components/ProductCard.vue'

const route = useRoute()

// Filters state matching system specifications
const filters = reactive({
  category: '',
  size: [] as string[],
  color: [] as string[],
  min_price: 0,
  max_price: 10000000,
  sort: 'terbaru',
  search: '',
  page: 1
})

const products = ref<any[]>([])
const categories = ref<any[]>([])
const isLoading = ref(true)
const totalProducts = ref(0)
const totalPages = ref(1)
const isMobileFilterOpen = ref(false)

// Sizes and Colors Options
const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL']
const colorOptions = [
  { name: 'Black', hex: '#000000' },
  { name: 'Gray', hex: '#808080' },
  { name: 'White', hex: '#FFFFFF', border: true },
  { name: 'Red', hex: '#CC0000' },
  { name: 'Olive', hex: '#556B2F' }
]

// Mock databases
const mockCategories = [
  { id: 1, name: 'Outerwear', slug: 'outerwear' },
  { id: 2, name: 'Tops', slug: 'tops' },
  { id: 3, name: 'Bottoms', slug: 'bottoms' }
]

const mockCatalogProducts = [
  { id: 1, name: 'BRUTALIST OVERCOAT', slug: 'brutalist-overcoat', sku: 'SKU-OVER-09', price: 1499000, category: 'outerwear', sizes: ['M', 'L', 'XL'], colors: ['Black', 'Gray'], image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80', variants: [{ id: 1, stock: 10 }] },
  { id: 2, name: 'CLINICAL UTILITY VEST', slug: 'clinical-utility-vest', sku: 'SKU-VEST-44', price: 899000, category: 'outerwear', sizes: ['S', 'M', 'L'], colors: ['Gray', 'Olive'], image_url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80', variants: [{ id: 2, stock: 5 }] },
  { id: 3, name: 'ASYMMETRIC CARGO PANTS', slug: 'asymmetric-cargo-pants', sku: 'SKU-CARG-88', price: 950000, category: 'bottoms', sizes: ['S', 'M'], colors: ['Olive', 'Black'], image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80', variants: [{ id: 3, stock: 0 }] },
  { id: 4, name: 'RAW EDGE SWEATSHIRT', slug: 'raw-edge-sweatshirt', sku: 'SKU-SWEA-21', price: 799000, category: 'tops', sizes: ['M', 'L', 'XL', 'XXL'], colors: ['White', 'Black'], image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80', variants: [{ id: 4, stock: 12 }] },
  { id: 5, name: 'MODULAR BACKPACK', slug: 'modular-backpack', sku: 'SKU-BACK-12', price: 1200000, category: 'outerwear', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black'], image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', variants: [{ id: 5, stock: 3 }] },
  { id: 6, name: 'STRAP BOOTS HIGH-TOP', slug: 'strap-boots-high-top', sku: 'SKU-BOOT-07', price: 2199000, category: 'bottoms', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black'], image_url: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80', variants: [{ id: 6, stock: 8 }] },
  { id: 7, name: 'INDUSTRIAL BELT RED', slug: 'industrial-belt-red', sku: 'SKU-BELT-32', price: 350000, category: 'tops', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Red'], image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', variants: [{ id: 7, stock: 2 }] },
  { id: 8, name: 'HEAVYWEIGHT TEE BLACK', slug: 'heavyweight-tee-black', sku: 'SKU-TEEE-01', price: 450000, category: 'tops', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black'], image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', variants: [{ id: 8, stock: 25 }] }
]

const fetchProducts = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/products', {
      params: {
        category: filters.category,
        size: filters.size.join(','),
        color: filters.color.join(','),
        min_price: filters.min_price,
        max_price: filters.max_price,
        sort: filters.sort,
        search: filters.search,
        page: filters.page,
        limit: 6
      }
    })
    const data = response.data?.data || response.data
    
    if (Array.isArray(data) && data.length > 0) {
      products.value = data
      totalProducts.value = response.data.total || data.length
      totalPages.value = response.data.last_page || Math.ceil(totalProducts.value / 6)
    } else {
      // Empty response or empty database
      applyLocalFiltering()
    }
  } catch (error) {
    console.warn('API error, falling back to local mock filtering:', error)
    applyLocalFiltering()
  } finally {
    // Delay to let visual transition breathe
    setTimeout(() => {
      isLoading.value = false
    }, 400)
  }
}

// Client-side filtering fallback for demo robustness
const applyLocalFiltering = () => {
  let result = [...mockCatalogProducts]

  // Category Filter
  if (filters.category) {
    result = result.filter(p => p.category === filters.category)
  }

  // Size Filter
  if (filters.size.length > 0) {
    result = result.filter(p => p.sizes?.some(s => filters.size.includes(s)))
  }

  // Color Filter
  if (filters.color.length > 0) {
    result = result.filter(p => p.colors?.some(c => filters.color.includes(c)))
  }

  // Search Filter
  if (filters.search) {
    const query = filters.search.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query))
  }

  // Price Filter
  result = result.filter(p => p.price >= filters.min_price && p.price <= filters.max_price)

  // Sort Filter
  if (filters.sort === 'terbaru') {
    result.sort((a, b) => b.id - a.id)
  } else if (filters.sort === 'harga_rendah') {
    result.sort((a, b) => a.price - b.price)
  } else if (filters.sort === 'harga_tinggi') {
    result.sort((a, b) => b.price - a.price)
  } else if (filters.sort === 'nama') {
    result.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Pagination
  const itemsPerPage = 6
  totalProducts.value = result.length
  totalPages.value = Math.ceil(result.length / itemsPerPage) || 1

  // Handle page boundaries
  if (filters.page > totalPages.value) filters.page = 1

  const start = (filters.page - 1) * itemsPerPage
  products.value = result.slice(start, start + itemsPerPage)
}

// Watch filters object and trigger debounce query
let debounceTimer: any = null
watch(
  () => ({ ...filters }),
  (newVal, oldVal) => {
    // Check if only page changed, no need to reset page to 1
    if (newVal.page === oldVal.page) {
      filters.page = 1
    }
    
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      fetchProducts()
    }, 300)
  },
  { deep: true }
)

const resetFilters = () => {
  filters.category = ''
  filters.size = []
  filters.color = []
  filters.min_price = 0
  filters.max_price = 10000000
  filters.sort = 'terbaru'
  filters.search = ''
  filters.page = 1
}

const selectCategory = (slug: string) => {
  filters.category = filters.category === slug ? '' : slug
}

const toggleSize = (size: string) => {
  const index = filters.size.indexOf(size)
  if (index > -1) {
    filters.size.splice(index, 1)
  } else {
    filters.size.push(size)
  }
}

const toggleColor = (color: string) => {
  const index = filters.color.indexOf(color)
  if (index > -1) {
    filters.color.splice(index, 1)
  } else {
    filters.color.push(color)
  }
}

onMounted(async () => {
  // Check category query param
  if (route.query.category) {
    filters.category = route.query.category as string
  }

  // Load category filter checklist
  try {
    const res = await api.get('/categories')
    const data = res.data?.data || res.data
    categories.value = Array.isArray(data) && data.length > 0 ? data : mockCategories
  } catch (error) {
    categories.value = mockCategories
  }

  fetchProducts()
})
</script>

<template>
  <div class="space-y-6">
    
    <!-- Title and Header Area -->
    <div class="border-b-4 border-black pb-4 flex items-center justify-between">
      <h1 class="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black">
        CATALOGUE_SYSTEM
      </h1>
      <button 
        @click="isMobileFilterOpen = true" 
        class="md:hidden px-4 py-2 border-4 border-black font-bold uppercase active:scale-95 bg-white text-black text-xs"
      >
        OPEN_FILTERS
      </button>
    </div>

    <!-- Main Two-Column Layout -->
    <div class="flex flex-col md:flex-row gap-8 items-start relative">
      
      <!-- ================= SIDEBAR FILTER (Desktop) ================= -->
      <aside class="hidden md:block w-1/4 sticky top-24 bg-white space-y-6">
        
        <div class="border-4 border-black bg-black text-white p-3 font-bold text-center tracking-wider text-sm select-none">
          FILTER_PROTOCOL
        </div>

        <div class="border-4 border-black p-4 space-y-6">
          
          <!-- Category Filter Checklist -->
          <div class="space-y-2">
            <h3 class="font-bold border-b-2 border-black pb-1 text-sm uppercase">CATEGORY</h3>
            <div class="space-y-2">
              <label 
                v-for="cat in categories" 
                :key="cat.slug" 
                class="flex items-center space-x-2 font-medium text-sm cursor-pointer"
              >
                <input 
                  type="checkbox" 
                  :checked="filters.category === cat.slug"
                  @change="selectCategory(cat.slug)"
                  class="w-4 h-4 border-2 border-black rounded-none appearance-none checked:bg-black checked:border-black focus:ring-0"
                />
                <span class="uppercase font-semibold select-none">{{ cat.name }}</span>
              </label>
            </div>
          </div>

          <!-- Size Filter Checklist -->
          <div class="space-y-2">
            <h3 class="font-bold border-b-2 border-black pb-1 text-sm uppercase">SIZE</h3>
            <div class="grid grid-cols-3 gap-2">
              <button 
                v-for="size in sizeOptions" 
                :key="size"
                @click="toggleSize(size)"
                class="py-2 border-2 border-black font-mono font-bold text-xs uppercase transition-all"
                :class="filters.size.includes(size) ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <!-- Color Filter Checklist -->
          <div class="space-y-2">
            <h3 class="font-bold border-b-2 border-black pb-1 text-sm uppercase">COLOR</h3>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="col in colorOptions" 
                :key="col.name"
                @click="toggleColor(col.name)"
                class="w-8 h-8 border-2 border-black transition-all flex items-center justify-center relative hover:scale-110 active:scale-90"
                :style="{ backgroundColor: col.hex }"
                :title="col.name"
              >
                <!-- Checked Indicator -->
                <span 
                  v-if="filters.color.includes(col.name)" 
                  class="absolute text-[10px] font-black pointer-events-none"
                  :class="col.name === 'White' ? 'text-black' : 'text-white'"
                >
                  ✓
                </span>
              </button>
            </div>
          </div>

          <!-- Price Min-Max Input -->
          <div class="space-y-2">
            <h3 class="font-bold border-b-2 border-black pb-1 text-sm uppercase">PRICE RANGE</h3>
            <div class="space-y-2 font-mono text-xs">
              <div class="flex items-center space-x-2">
                <span class="w-8 font-bold">MIN:</span>
                <input 
                  type="number" 
                  v-model.number="filters.min_price" 
                  class="w-full border-2 border-black p-1 focus:ring-0 text-sm"
                />
              </div>
              <div class="flex items-center space-x-2">
                <span class="w-8 font-bold">MAX:</span>
                <input 
                  type="number" 
                  v-model.number="filters.max_price" 
                  class="w-full border-2 border-black p-1 focus:ring-0 text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-2 pt-2">
            <button 
              @click="fetchProducts"
              class="w-full py-3 bg-[#CC0000] text-white border-2 border-black font-black uppercase text-xs hover:bg-black transition-all active:scale-95"
            >
              APPLY_FILTER
            </button>
            <button 
              @click="resetFilters"
              class="w-full py-3 bg-black text-white border-2 border-black font-black uppercase text-xs hover:bg-gray-800 transition-all active:scale-95"
            >
              RESET_FILTERS
            </button>
          </div>

        </div>
      </aside>

      <!-- ================= PRODUCT AREA (Desktop/Mobile) ================= -->
      <section class="w-full md:w-3/4 space-y-6">
        
        <!-- Search bar Labeled SEARCH_PROTOCOL -->
        <div class="flex flex-col sm:flex-row gap-2">
          <div class="relative flex-grow">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-xs font-mono font-bold text-gray-500 uppercase">SEARCH_PROTOCOL:</span>
            </div>
            <input 
              type="text" 
              v-model="filters.search"
              placeholder="ENTER MODEL NAME OR SKU NUMBER" 
              class="w-full border-4 border-black py-3 pl-36 pr-4 focus:ring-0 font-mono text-sm uppercase placeholder-gray-400"
            />
          </div>
          
          <!-- Dropdown Sorting -->
          <select 
            v-model="filters.sort" 
            class="border-4 border-black px-4 py-3 font-mono text-xs uppercase focus:ring-0 cursor-pointer bg-white text-black sm:w-48"
          >
            <option value="terbaru">LATEST_ARRIVALS</option>
            <option value="harga_rendah">PRICE: LOW_TO_HIGH</option>
            <option value="harga_tinggi">PRICE: HIGH_TO_LOW</option>
            <option value="nama">SORT: ALPHABETICAL</option>
          </select>
        </div>

        <!-- Info Result -->
        <div class="flex items-center justify-between font-mono text-xs text-gray-500 font-bold bg-[#F9F9F9] border-2 border-black p-2 uppercase">
          <span>MENAMPILKAN {{ totalProducts }} PRODUK</span>
          <span>PAGE_STATE: {{ filters.page }} / {{ totalPages }}</span>
        </div>

        <!-- Skeletons Loader -->
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="i in 6" 
            :key="i" 
            class="border-4 border-black p-4 bg-[#F9F9F9] animate-pulse space-y-4"
          >
            <div class="w-full aspect-square bg-gray-300 border-4 border-black"></div>
            <div class="h-6 bg-gray-300 w-3/4"></div>
            <div class="h-6 bg-gray-300 w-1/3"></div>
            <div class="h-10 bg-gray-300 w-full"></div>
          </div>
        </div>

        <!-- Product Grid -->
        <div v-else-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard 
            v-for="product in products" 
            :key="product.id" 
            :product="product" 
          />
        </div>

        <!-- Empty State Box "NO_RESULTS_FOUND" -->
        <div 
          v-else 
          class="border-4 border-black bg-white text-center py-16 px-4 flex flex-col items-center justify-center space-y-4 shadow-[6px_6px_0px_#CC0000]"
        >
          <div class="bg-[#CC0000] text-white border-2 border-black font-mono text-xs px-3 py-1 font-bold select-none tracking-widest uppercase">
            NO_RESULTS_FOUND
          </div>
          <h2 class="text-2xl font-black uppercase tracking-tight text-black">
            CRITICAL: SPECIFIED SEARCH OR FILTER PARAMETERS MATCHED ZERO INVENTORY.
          </h2>
          <p class="text-sm font-medium text-gray-500 max-w-md">
            Please verify search parameters or click the reset button below to restore full database pipeline flow.
          </p>
          <button 
            @click="resetFilters" 
            class="px-6 py-3 bg-black text-white border-2 border-black font-black uppercase text-xs hover:bg-[#CC0000] transition-all active:scale-95 shadow-[4px_4px_0px_#000000]"
          >
            RESET_CATALOGUE_SYSTEM
          </button>
        </div>

        <!-- Pagination Controls -->
        <div v-if="products.length > 0" class="flex justify-center items-center space-x-4 pt-6 border-t-2 border-black select-none">
          <button 
            @click="filters.page--" 
            :disabled="filters.page === 1"
            class="px-4 py-3 border-4 border-black font-black uppercase text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 hover:bg-black hover:text-white bg-white text-black"
          >
            PREV_PAGE
          </button>
          
          <span class="font-mono font-black text-sm border-4 border-black bg-black text-white px-4 py-2 select-none">
            {{ filters.page }}
          </span>

          <button 
            @click="filters.page++" 
            :disabled="filters.page >= totalPages"
            class="px-4 py-3 border-4 border-black font-black uppercase text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 hover:bg-black hover:text-white bg-white text-black"
          >
            NEXT_PAGE
          </button>
        </div>

      </section>

    </div>

    <!-- ================= MOBILE FILTER MODAL DRAWER ================= -->
    <div 
      v-if="isMobileFilterOpen" 
      @click="isMobileFilterOpen = false" 
      class="fixed inset-0 bg-black/60 z-50 transition-opacity"
    ></div>

    <div 
      class="fixed top-0 right-0 h-full w-80 max-w-full bg-white border-l-4 border-black z-50 p-6 flex flex-col justify-between transform transition-transform duration-300 overflow-y-auto shadow-[-8px_0px_0px_#000000]"
      :class="isMobileFilterOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="space-y-6">
        <div class="flex items-center justify-between pb-4 border-b-4 border-black">
          <h2 class="text-xl font-black uppercase tracking-tight text-black">
            FILTER_PROTOCOL
          </h2>
          <button 
            @click="isMobileFilterOpen = false" 
            class="p-1 border-2 border-black hover:bg-black hover:text-white transition-all active:scale-95 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <!-- Category Checklist -->
        <div class="space-y-2">
          <h3 class="font-bold border-b-2 border-black pb-1 text-sm uppercase">CATEGORY</h3>
          <div class="space-y-2">
            <label 
              v-for="cat in categories" 
              :key="cat.slug" 
              class="flex items-center space-x-2 font-medium text-sm cursor-pointer"
            >
              <input 
                type="checkbox" 
                :checked="filters.category === cat.slug"
                @change="selectCategory(cat.slug)"
                class="w-4 h-4 border-2 border-black rounded-none appearance-none checked:bg-black checked:border-black focus:ring-0"
              />
              <span class="uppercase font-semibold select-none">{{ cat.name }}</span>
            </label>
          </div>
        </div>

        <!-- Size Checklist -->
        <div class="space-y-2">
          <h3 class="font-bold border-b-2 border-black pb-1 text-sm uppercase">SIZE</h3>
          <div class="grid grid-cols-3 gap-2">
            <button 
              v-for="size in sizeOptions" 
              :key="size"
              @click="toggleSize(size)"
              class="py-2 border-2 border-black font-mono font-bold text-xs uppercase transition-all"
              :class="filters.size.includes(size) ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <!-- Color Checklist -->
        <div class="space-y-2">
          <h3 class="font-bold border-b-2 border-black pb-1 text-sm uppercase">COLOR</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              v-for="col in colorOptions" 
              :key="col.name"
              @click="toggleColor(col.name)"
              class="w-8 h-8 border-2 border-black transition-all flex items-center justify-center relative hover:scale-110 active:scale-90"
              :style="{ backgroundColor: col.hex }"
              :title="col.name"
            >
              <span 
                v-if="filters.color.includes(col.name)" 
                class="absolute text-[10px] font-black pointer-events-none"
                :class="col.name === 'White' ? 'text-black' : 'text-white'"
              >
                ✓
              </span>
            </button>
          </div>
        </div>

        <!-- Price range -->
        <div class="space-y-2">
          <h3 class="font-bold border-b-2 border-black pb-1 text-sm uppercase">PRICE RANGE</h3>
          <div class="space-y-2 font-mono text-xs">
            <div class="flex items-center space-x-2">
              <span class="w-8 font-bold">MIN:</span>
              <input 
                type="number" 
                v-model.number="filters.min_price" 
                class="w-full border-2 border-black p-1 focus:ring-0 text-sm"
              />
            </div>
            <div class="flex items-center space-x-2">
              <span class="w-8 font-bold">MAX:</span>
              <input 
                type="number" 
                v-model.number="filters.max_price" 
                class="w-full border-2 border-black p-1 focus:ring-0 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Drawer Actions -->
      <div class="border-t-4 border-black pt-4 mt-6 space-y-2">
        <button 
          @click="fetchProducts(); isMobileFilterOpen = false"
          class="w-full py-3 bg-[#CC0000] text-white border-2 border-black font-black uppercase text-xs hover:bg-black transition-all active:scale-95"
        >
          APPLY_FILTER
        </button>
        <button 
          @click="resetFilters(); isMobileFilterOpen = false"
          class="w-full py-3 bg-black text-white border-2 border-black font-black uppercase text-xs hover:bg-gray-800 transition-all active:scale-95"
        >
          RESET_FILTERS
        </button>
      </div>
    </div>

  </div>
</template>
