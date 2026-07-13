<script setup lang="ts">
import { onMounted, ref, computed, watch, reactive } from 'vue';
import api from '@/api/axios.js';
import Badge from '@/components/shared/Badge.vue';
import Modal from '@/components/shared/Modal.vue';
import { useToastStore } from '@/stores/toast';

interface ProductVariant {
  id?: number;
  size: string;
  color: string;
  stock: number;
  sku: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  variants: ProductVariant[];
}

const toastStore = useToastStore();
const products = ref<Product[]>([]);
const isLoading = ref(false);

// Modal states
const showModal = ref(false);
const showDeleteConfirm = ref(false);
const editProduct = ref<Product | null>(null);
const productToDelete = ref<number | null>(null);

// Form bindings
const productForm = reactive({
  name: '',
  category: '',
  description: '',
  price: 0,
  image_url: '',
  is_active: true
});

const variants = ref<ProductVariant[]>([]);

// Upload state
const photoFile = ref<File | null>(null);
const photoPreview = ref<string | null>(null);

// Computed stats metrics
const stockValuation = computed(() => {
  return products.value.reduce((acc, p) => {
    const totalStock = p.variants.reduce((vAcc, v) => vAcc + v.stock, 0);
    return acc + (p.price * totalStock);
  }, 0);
});

const activeSkuCount = computed(() => {
  return products.value.reduce((acc, p) => acc + p.variants.length, 0);
});

onMounted(() => {
  fetchProducts();
});

async function fetchProducts() {
  isLoading.value = true;
  try {
    const res = await api.get('/api/admin/products');
    products.value = res.data;
  } catch (err) {
    console.error('Failed to fetch products:', err);
    // Simulation fallback products
    products.value = [
      {
        id: 1,
        name: 'CLINICAL BRUTALIST JACKET',
        category: 'OUTERWEAR',
        description: 'Tough raw canvas with steel zipper and dual cargo chambers.',
        price: 349000,
        image_url: '',
        is_active: true,
        variants: [
          { id: 1, size: 'M', color: 'BLACK', stock: 12, sku: 'KT-JKT-MB-1' },
          { id: 2, size: 'L', color: 'BLACK', stock: 5, sku: 'KT-JKT-LB-2' }
        ]
      },
      {
        id: 2,
        name: 'RAW CONTRAST HOODIE',
        category: 'OUTERWEAR',
        description: 'Heavy fleece high contrast raw lines styling.',
        price: 299000,
        image_url: '',
        is_active: true,
        variants: [
          { id: 3, size: 'S', color: 'WHITE', stock: 8, sku: 'KT-HD-SW-1' },
          { id: 4, size: 'M', color: 'WHITE', stock: 3, sku: 'KT-HD-MW-2' }
        ]
      },
      {
        id: 3,
        name: 'KETCE BOXER SET',
        category: 'BASICS',
        description: 'Three pack raw combed cotton basics.',
        price: 175000,
        image_url: '',
        is_active: false,
        variants: [
          { id: 5, size: 'M', color: 'GRAY', stock: 20, sku: 'KT-BX-MG-1' }
        ]
      }
    ];
  } finally {
    isLoading.value = false;
  }
}

// Watch variant changes and auto generate SKU
watch(() => [productForm.name, variants.value], () => {
  generateVariantSkus();
}, { deep: true });

function generateVariantSkus() {
  const namePrefix = (productForm.name || 'PROD').slice(0, 3).toUpperCase();
  variants.value.forEach((v, index) => {
    const sizePart = (v.size || 'XX').slice(0, 2).toUpperCase();
    const colorPart = (v.color || 'YY').slice(0, 2).toUpperCase();
    v.sku = `KT-${namePrefix}-${sizePart}${colorPart}-${index + 1}`;
  });
}

function openAddModal() {
  editProduct.value = null;
  productForm.name = '';
  productForm.category = '';
  productForm.description = '';
  productForm.price = 0;
  productForm.image_url = '';
  productForm.is_active = true;
  variants.value = [{ size: 'M', color: 'BLACK', stock: 5, sku: '' }];
  photoFile.value = null;
  photoPreview.value = null;
  showModal.value = true;
}

function openEditModal(prod: Product) {
  editProduct.value = prod;
  productForm.name = prod.name;
  productForm.category = prod.category;
  productForm.description = prod.description;
  productForm.price = prod.price;
  productForm.image_url = prod.image_url;
  productForm.is_active = prod.is_active;
  // Clone variants
  variants.value = prod.variants.map(v => ({ ...v }));
  photoFile.value = null;
  photoPreview.value = prod.image_url || null;
  showModal.value = true;
}

function addVariantRow() {
  variants.value.push({
    size: 'M',
    color: 'BLACK',
    stock: 5,
    sku: ''
  });
}

function removeVariantRow(index: number) {
  variants.value.splice(index, 1);
}

function onPhotoChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    photoFile.value = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      photoPreview.value = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

async function handleSaveProduct() {
  if (!productForm.name || !productForm.category || productForm.price <= 0) {
    toastStore.trigger('PLEASE_FILL_REQUIRED_FIELDS', 'error');
    return;
  }
  if (variants.value.length === 0) {
    toastStore.trigger('PRODUCT_MUST_HAVE_ONE_VARIANT', 'error');
    return;
  }

  isLoading.value = true;
  
  // Use FormData because we can have image upload
  const data = new FormData();
  data.append('name', productForm.name);
  data.append('category', productForm.category);
  data.append('description', productForm.description);
  data.append('price', String(productForm.price));
  data.append('is_active', String(productForm.is_active ? 1 : 0));
  data.append('variants', JSON.stringify(variants.value));
  if (photoFile.value) {
    data.append('photo', photoFile.value);
  }

  try {
    if (editProduct.value) {
      // Laravel PUT with files needs standard _method spoofing
      if (photoFile.value) {
        data.append('_method', 'PUT');
        await api.post(`/api/admin/products/${editProduct.value.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.put(`/api/admin/products/${editProduct.value.id}`, {
          ...productForm,
          variants: variants.value
        });
      }
      toastStore.trigger('PRODUCT_UPDATED_SUCCESS', 'success');
    } else {
      await api.post('/api/admin/products', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toastStore.trigger('PRODUCT_CREATED_SUCCESS', 'success');
    }
    showModal.value = false;
    fetchProducts();
  } catch (err) {
    console.error('Failed to save product:', err);
    // Simulating updates locally
    if (editProduct.value) {
      const idx = products.value.findIndex(p => p.id === editProduct.value!.id);
      if (idx !== -1) {
        products.value[idx] = {
          ...editProduct.value!,
          ...productForm,
          variants: variants.value,
          image_url: photoPreview.value || ''
        };
      }
      toastStore.trigger('PRODUCT_UPDATED_SIMULATED', 'success');
    } else {
      products.value.push({
        id: Date.now(),
        ...productForm,
        image_url: photoPreview.value || '',
        variants: variants.value
      });
      toastStore.trigger('PRODUCT_CREATED_SIMULATED', 'success');
    }
    showModal.value = false;
  } finally {
    isLoading.value = false;
  }
}

async function handleToggleStatus(product: Product) {
  isLoading.value = true;
  try {
    await api.patch(`/api/admin/products/${product.id}/toggle`);
    product.is_active = !product.is_active;
    toastStore.trigger('PRODUCT_STATUS_CHANGED', 'success');
  } catch (err) {
    console.error('Failed to toggle status:', err);
    product.is_active = !product.is_active; // Simulated change
    toastStore.trigger('STATUS_TOGGLED_SIMULATED', 'success');
  } finally {
    isLoading.value = false;
  }
}

function confirmDelete(id: number) {
  productToDelete.value = id;
  showDeleteConfirm.value = true;
}

async function handleDeleteProduct() {
  if (productToDelete.value === null) return;
  isLoading.value = true;
  try {
    await api.delete(`/api/admin/products/${productToDelete.value}`);
    toastStore.trigger('PRODUCT_DELETED_SUCCESS', 'success');
    showDeleteConfirm.value = false;
    productToDelete.value = null;
    fetchProducts();
  } catch (err) {
    console.error('Failed to delete product:', err);
    products.value = products.value.filter(p => p.id !== productToDelete.value);
    toastStore.trigger('PRODUCT_DELETED_SIMULATED', 'success');
    showDeleteConfirm.value = false;
    productToDelete.value = null;
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

function getSumStock(prod: Product) {
  return prod.variants.reduce((acc, v) => acc + v.stock, 0);
}
</script>

<template>
  <div class="flex flex-col gap-8 select-none">
    
    <!-- STATS CARDS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div class="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span class="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider">TOTAL_STOCK_VALUATION</span>
        <span class="text-3xl font-black font-mono text-[#CC0000] mt-2 block">
          {{ formatIDR(stockValuation) }}
        </span>
      </div>
      <div class="bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span class="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider">ACTIVE_SKU_REGISTRY</span>
        <span class="text-4xl font-extrabold text-black mt-2 block">
          {{ activeSkuCount }}
        </span>
      </div>
    </div>

    <!-- ACTION BUTTON & TABLE SECTION -->
    <div class="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-black pb-4 mb-6">
        <h3 class="text-xl font-black uppercase tracking-tighter text-black">
          SKU_REGISTRY
        </h3>
        <button 
          @click="openAddModal"
          class="brutalist-button-red bg-[#CC0000] text-white hover:bg-black font-bold uppercase tracking-wide text-xs border-2 border-black py-2.5 px-5"
        >
          + TAMBAH PRODUK
        </button>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse border-4 border-black text-left text-sm text-black">
          <thead class="bg-black text-white text-xs uppercase tracking-wider font-bold">
            <tr>
              <th class="border-2 border-black p-3 text-center">FOTO</th>
              <th class="border-2 border-black p-3 font-mono">SKU</th>
              <th class="border-2 border-black p-3">NAMA</th>
              <th class="border-2 border-black p-3">KATEGORI</th>
              <th class="border-2 border-black p-3 text-center">STOK</th>
              <th class="border-2 border-black p-3 text-right">HARGA</th>
              <th class="border-2 border-black p-3 text-center">STATUS</th>
              <th class="border-2 border-black p-3 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black font-medium">
            <tr v-for="prod in products" :key="prod.id" class="hover:bg-gray-50 transition-all border-b border-black">
              <!-- Photo -->
              <td class="border-2 border-black p-3 text-center">
                <div class="w-12 h-12 border-2 border-black bg-gray-100 flex items-center justify-center mx-auto overflow-hidden">
                  <img v-if="prod.image_url" :src="prod.image_url" class="w-full h-full object-cover filter grayscale" alt="Thumbnail" />
                  <span v-else class="text-[9px] font-mono text-gray-400 font-bold">NO_IMG</span>
                </div>
              </td>
              <!-- SKU (Mono list of variants) -->
              <td class="border-2 border-black p-3 font-mono text-xs max-w-[150px] truncate">
                <p v-for="v in prod.variants" :key="v.id" class="text-[10px]">
                  • {{ v.sku }}
                </p>
              </td>
              <!-- Name -->
              <td class="border-2 border-black p-3 uppercase font-bold text-black">{{ prod.name }}</td>
              <!-- Category -->
              <td class="border-2 border-black p-3 uppercase text-xs">{{ prod.category }}</td>
              <!-- Stock -->
              <td class="border-2 border-black p-3 text-center font-mono font-bold">{{ getSumStock(prod) }}</td>
              <!-- Price -->
              <td class="border-2 border-black p-3 font-mono text-right font-bold text-[#CC0000]">
                {{ formatIDR(prod.price) }}
              </td>
              <!-- Status Toggle -->
              <td class="border-2 border-black p-3 text-center">
                <button 
                  @click="handleToggleStatus(prod)"
                  :class="[
                    'px-3 py-1 font-mono text-xs font-bold uppercase transition-all duration-150 border-2 border-black active:scale-95',
                    prod.is_active ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-100'
                  ]"
                >
                  {{ prod.is_active ? 'ACTIVE' : 'INACTIVE' }}
                </button>
              </td>
              <!-- Action edit / delete -->
              <td class="border-2 border-black p-3 text-center">
                <div class="flex justify-center gap-2 select-none">
                  <button 
                    @click="openEditModal(prod)"
                    class="brutalist-button py-1 px-3 text-xs bg-white border border-black hover:bg-black hover:text-white"
                  >
                    EDIT
                  </button>
                  <button 
                    @click="confirmDelete(prod.id)"
                    class="brutalist-button py-1 px-3 text-xs bg-[#CC0000] text-white border border-black hover:bg-black hover:text-white"
                  >
                    HAPUS
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ADD/EDIT PRODUCT MODAL -->
    <Modal 
      :show="showModal" 
      :title="editProduct ? 'EDIT_SKU_REGISTRATION' : 'REGISTER_NEW_SKU'" 
      @close="showModal = false"
    >
      <div class="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1">
        
        <!-- Form elements -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block font-mono text-xs font-bold text-gray-600 mb-1 uppercase">PRODUCT_NAME *</label>
            <input v-model="productForm.name" type="text" class="w-full border-2 border-black p-2 text-sm focus:bg-gray-50 outline-none uppercase font-bold" placeholder="CLINICAL BRUTALIST JACKET" required />
          </div>
          <div>
            <label class="block font-mono text-xs font-bold text-gray-600 mb-1 uppercase">CATEGORY *</label>
            <input v-model="productForm.category" type="text" class="w-full border-2 border-black p-2 text-sm focus:bg-gray-50 outline-none uppercase font-semibold" placeholder="OUTERWEAR" required />
          </div>
          <div>
            <label class="block font-mono text-xs font-bold text-gray-600 mb-1 uppercase">PRICE (IDR) *</label>
            <input v-model.number="productForm.price" type="number" class="w-full border-2 border-black p-2 font-mono text-sm focus:bg-gray-50 outline-none" required />
          </div>
          <div class="sm:col-span-2">
            <label class="block font-mono text-xs font-bold text-gray-600 mb-1 uppercase">DESCRIPTION</label>
            <textarea v-model="productForm.description" rows="3" class="w-full border-2 border-black p-2 text-sm focus:bg-gray-50 outline-none" placeholder="Tough raw canvas with high contrast stitching."></textarea>
          </div>
        </div>

        <!-- Image Upload preview block -->
        <div>
          <label class="block font-mono text-xs font-bold text-gray-600 mb-1 uppercase">PRODUCT_VISUAL (PHOTO)</label>
          <div class="flex items-center gap-4 border-2 border-black p-3 bg-gray-50">
            <div class="w-16 h-16 border-2 border-black bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
              <img v-if="photoPreview" :src="photoPreview" class="w-full h-full object-cover" alt="Visual preview" />
              <span v-else class="text-[9px] font-mono text-gray-400 font-bold">PREVIEW</span>
            </div>
            <div>
              <input type="file" accept="image/*" @change="onPhotoChange" class="text-xs" />
              <p class="text-[9px] text-gray-400 font-mono mt-1">RECOMMENDED: SQUARE RATIO grayscale PNG/JPG</p>
            </div>
          </div>
        </div>

        <!-- Dynamic Variants Grid/Table -->
        <div class="border-2 border-black p-4 bg-gray-50">
          <div class="flex justify-between items-center border-b-2 border-black pb-2 mb-3">
            <h4 class="font-mono text-xs font-bold text-black uppercase">VARIANTS_MATRIX</h4>
            <button 
              @click="addVariantRow" 
              type="button"
              class="brutalist-button py-1 px-3 text-[10px] bg-black text-white hover:bg-white hover:text-black border border-black"
            >
              + ADD ROW
            </button>
          </div>

          <div class="flex flex-col gap-2">
            <div 
              v-for="(v, index) in variants" 
              :key="index"
              class="grid grid-cols-12 gap-2 items-center bg-white border border-black p-2"
            >
              <!-- Size -->
              <div class="col-span-3">
                <input v-model="v.size" type="text" class="w-full border border-black p-1 text-xs text-center font-mono font-bold uppercase" placeholder="SIZE" />
              </div>
              <!-- Color -->
              <div class="col-span-3">
                <input v-model="v.color" type="text" class="w-full border border-black p-1 text-xs text-center uppercase" placeholder="COLOR" />
              </div>
              <!-- Stock -->
              <div class="col-span-3">
                <input v-model.number="v.stock" type="number" class="w-full border border-black p-1 text-xs text-center font-mono" placeholder="QTY" min="0" />
              </div>
              <!-- SKU (auto generated / display) -->
              <div class="col-span-2 text-center">
                <span class="font-mono text-[9px] text-gray-400 font-bold truncate block" :title="v.sku">
                  {{ v.sku || 'SKU_AUTO' }}
                </span>
              </div>
              <!-- Delete Row -->
              <div class="col-span-1 text-center">
                <button 
                  @click="removeVariantRow(index)" 
                  type="button" 
                  :disabled="variants.length <= 1"
                  class="font-mono font-bold text-red-600 hover:text-black text-xs disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <button 
          @click="handleSaveProduct"
          :disabled="isLoading"
          class="w-full brutalist-button-red bg-[#CC0000] text-white hover:bg-black p-3 font-bold uppercase text-center border-2 border-black active:scale-95 transition-all text-sm mt-2"
        >
          {{ editProduct ? 'SAVE_PRODUCT_EDITS' : 'SAVE_PRODUCT_NEW' }}
        </button>

      </div>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal 
      :show="showDeleteConfirm" 
      title="DELETION_PRODUCT_ALERT" 
      @close="showDeleteConfirm = false"
    >
      <p class="mb-4 font-semibold text-black">Are you sure you want to permanently delete this product SKU registration from inventory?</p>
      <p class="text-xs text-[#CC0000] font-bold uppercase mb-6">🚨 WARNING: This action removes the product and all associated SKU variants. This cannot be undone.</p>
      <div class="flex justify-end gap-3">
        <button @click="showDeleteConfirm = false" class="brutalist-button py-2 px-4 text-xs">CANCEL</button>
        <button @click="handleDeleteProduct" class="brutalist-button-red py-2 px-4 text-xs">CONFIRM_DELETE</button>
      </div>
    </Modal>

  </div>
</template>
