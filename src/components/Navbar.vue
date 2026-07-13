<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useCartStore } from '../stores/cart.js'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const isMobileMenuOpen = ref(false)
const isUserDropdownOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const toggleUserDropdown = () => {
  isUserDropdownOpen.value = !isUserDropdownOpen.value
}

const handleLogout = async () => {
  isUserDropdownOpen.value = false
  isMobileMenuOpen.value = false
  await authStore.logout()
}

const navigateToCart = () => {
  // Direct to cart page (which will be implemented in fe2-cart)
  router.push('/cart')
}
</script>

<template>
  <header class="sticky top-0 z-50 w-full bg-white border-b-4 border-black">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      
      <!-- Left: Hamburger Menu -->
      <div class="flex items-center">
        <button 
          @click="toggleMobileMenu" 
          class="p-2 border-4 border-black hover:bg-black hover:text-white transition-all active:scale-95 flex items-center justify-center"
          aria-label="Toggle Navigation Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <!-- Center: Branding -->
      <div class="absolute left-1/2 transform -translate-x-1/2">
        <router-link to="/" class="text-3xl font-black uppercase tracking-tighter text-black select-none">
          KETCE<span class="text-[#CC0000]">.</span>
        </router-link>
      </div>

      <!-- Right: Cart & Auth Actions -->
      <div class="flex items-center space-x-4">
        <!-- Cart Icon + Badge -->
        <button 
          @click="navigateToCart" 
          class="relative p-2 border-4 border-black hover:bg-[#CC0000] hover:text-white transition-all active:scale-95 flex items-center justify-center bg-white text-black"
          aria-label="Cart"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <span 
            v-if="cartStore.totalItems > 0" 
            class="absolute -top-2 -right-2 bg-[#CC0000] text-white border-2 border-black font-black text-xs min-w-[20px] h-5 px-1 flex items-center justify-center font-mono select-none"
          >
            {{ cartStore.totalItems }}
          </span>
        </button>

        <!-- Auth Actions -->
        <div v-if="authStore.isLoggedIn" class="relative">
          <button 
            @click="toggleUserDropdown" 
            class="hidden md:flex items-center px-4 py-2 border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-all active:scale-95 bg-white text-black text-sm"
          >
            <span>{{ (authStore.user as any)?.name ? (authStore.user as any).name.split(' ')[0] : 'USER' }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 ml-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          
          <!-- Dropdown logout -->
          <div 
            v-if="isUserDropdownOpen" 
            class="absolute right-0 mt-2 w-48 bg-white border-4 border-black shadow-[4px_4px_0px_#000000] z-50"
          >
            <div class="p-3 border-b-2 border-black font-bold text-xs text-gray-500 uppercase tracking-wider bg-[#F9F9F9]">
              Signed in as:<br>
              <span class="text-black font-black block truncate text-sm mt-1">{{ (authStore.user as any)?.email }}</span>
            </div>
            
            <!-- Admin or Courier dashboards -->
            <router-link 
              v-if="authStore.role === 'admin'"
              to="/admin/dashboard" 
              class="block w-full text-left px-4 py-3 text-sm font-bold uppercase hover:bg-black hover:text-white transition-all border-b-2 border-black"
              @click="isUserDropdownOpen = false"
            >
              ADMIN_PORTAL
            </router-link>
            <router-link 
              v-if="authStore.role === 'kurir'"
              to="/courier/dashboard" 
              class="block w-full text-left px-4 py-3 text-sm font-bold uppercase hover:bg-black hover:text-white transition-all border-b-2 border-black"
              @click="isUserDropdownOpen = false"
            >
              COURIER_PORTAL
            </router-link>
            
            <button 
              @click="handleLogout" 
              class="block w-full text-left px-4 py-3 text-sm font-bold uppercase text-[#CC0000] hover:bg-[#CC0000] hover:text-white transition-all"
            >
              LOGOUT
            </button>
          </div>
        </div>
        
        <router-link 
          v-else 
          to="/login" 
          class="hidden md:block px-4 py-2 border-4 border-black bg-white text-black font-bold uppercase hover:bg-black hover:text-white transition-all active:scale-95 text-sm"
        >
          LOGIN
        </router-link>
      </div>

    </div>
  </header>

  <!-- Mobile Drawer Menu Overlay -->
  <div 
    v-if="isMobileMenuOpen" 
    @click="toggleMobileMenu" 
    class="fixed inset-0 bg-black/60 z-50 transition-opacity"
  ></div>

  <!-- Mobile Drawer Menu Content -->
  <div 
    class="fixed top-0 left-0 h-full w-80 max-w-full bg-white border-r-4 border-black z-50 p-6 flex flex-col justify-between transform transition-transform duration-300 shadow-[8px_0px_0px_#000000]"
    :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div>
      <div class="flex items-center justify-between pb-6 border-b-4 border-black">
        <router-link to="/" @click="toggleMobileMenu" class="text-3xl font-black uppercase tracking-tighter text-black">
          KETCE<span class="text-[#CC0000]">.</span>
        </router-link>
        <button 
          @click="toggleMobileMenu" 
          class="p-2 border-4 border-black hover:bg-black hover:text-white transition-all active:scale-95 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="mt-8 flex flex-col space-y-4">
        <router-link 
          to="/" 
          @click="toggleMobileMenu" 
          class="block py-3 px-4 border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-all text-lg"
          active-class="bg-black text-white"
        >
          HOME
        </router-link>
        <router-link 
          to="/catalog" 
          @click="toggleMobileMenu" 
          class="block py-3 px-4 border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-all text-lg"
          active-class="bg-black text-white"
        >
          CATALOG
        </router-link>
        <router-link 
          to="/cart" 
          @click="toggleMobileMenu" 
          class="block py-3 px-4 border-4 border-black font-bold uppercase hover:bg-black hover:text-white transition-all text-lg"
          active-class="bg-black text-white"
        >
          SHOPPING_CART ({{ cartStore.totalItems }})
        </router-link>
      </nav>
    </div>

    <!-- Mobile Drawer Footer (User Info & Auth Action) -->
    <div class="border-t-4 border-black pt-6">
      <div v-if="authStore.isLoggedIn" class="space-y-4">
        <div class="p-3 border-4 border-black bg-[#F9F9F9] font-mono text-xs">
          <p class="font-bold text-gray-500 uppercase">ACTIVE_SESSION:</p>
          <p class="font-black text-black break-all">{{ (authStore.user as any)?.email }}</p>
          <p class="font-bold text-[#CC0000] uppercase mt-1">ROLE: {{ authStore.role }}</p>
        </div>
        
        <router-link 
          v-if="authStore.role === 'admin'"
          to="/admin/dashboard" 
          @click="toggleMobileMenu"
          class="block w-full text-center py-3 border-4 border-black font-bold uppercase bg-white hover:bg-black hover:text-white transition-all text-sm"
        >
          ADMIN_PORTAL
        </router-link>
        <router-link 
          v-if="authStore.role === 'kurir'"
          to="/courier/dashboard" 
          @click="toggleMobileMenu"
          class="block w-full text-center py-3 border-4 border-black font-bold uppercase bg-white hover:bg-black hover:text-white transition-all text-sm"
        >
          COURIER_PORTAL
        </router-link>
        
        <button 
          @click="handleLogout" 
          class="w-full py-3 border-4 border-black font-bold uppercase bg-[#CC0000] text-white hover:bg-black transition-all text-sm active:scale-95"
        >
          LOGOUT_SESSION
        </button>
      </div>
      <div v-else>
        <router-link 
          to="/login" 
          @click="toggleMobileMenu"
          class="block w-full text-center py-3 border-4 border-black font-bold uppercase bg-[#CC0000] text-white hover:bg-black transition-all text-sm active:scale-95"
        >
          LOGIN_SESSION
        </router-link>
      </div>
    </div>
  </div>
</template>
