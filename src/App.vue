<script setup lang="ts">
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'
import { useCartStore } from './stores/cart.js'

const authStore = useAuthStore()
const cartStore = useCartStore()

onMounted(async () => {
  if (authStore.token) {
    try {
      await authStore.fetchUser()
      await cartStore.fetchCart()
    } catch (e) {
      console.error('Failed to load user or cart details:', e)
    }
  }
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-white text-black">
    <Navbar />
    
    <main class="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <Footer />
  </div>
</template>

<style>
/* Reset default #app styles if any */
#app {
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
}
</style>
