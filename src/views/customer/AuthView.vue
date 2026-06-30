<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const loginCustomer = () => {
  auth.login('mock-token-customer', 'customer', { name: 'Jane Doe', email: 'jane@ketce.com' });
  router.push('/cart');
};

const loginAdmin = () => {
  auth.login('mock-token-admin', 'admin', { name: 'Aditya Pratama', email: 'aditya.admin@ketce.com' });
  router.push('/admin/dashboard');
};

const loginCourier = () => {
  auth.login('mock-token-kurir', 'kurir', { name: 'Budi Santoso', email: 'budi.courier@ketce.com' });
  router.push('/courier/dashboard');
};
</script>

<template>
  <div class="min-h-screen bg-[#F9F9F9] flex flex-col justify-center items-center p-6">
    <div class="w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h1 class="text-4xl font-extrabold uppercase tracking-tighter text-black mb-6 text-center border-b-4 border-black pb-4">
        KETCE<span class="text-[#CC0000]">_PORTAL</span>
      </h1>
      <p class="text-mono text-sm text-center mb-6 font-bold uppercase">Select Role to Begin Simulation</p>
      <div class="flex flex-col gap-4">
        <button @click="loginCustomer" class="w-full brutalist-button text-lg bg-[#FFFFFF] hover:bg-black hover:text-white p-3 font-bold border-4 border-black active:scale-95 transition-all">
          CUSTOMER ACCESS (CART)
        </button>
        <button @click="loginAdmin" class="w-full brutalist-button text-lg bg-[#CC0000] text-white hover:bg-black p-3 font-bold border-4 border-black active:scale-95 transition-all">
          ADMIN COMMAND CENTER
        </button>
        <button @click="loginCourier" class="w-full brutalist-button text-lg bg-black text-white hover:bg-gray-800 p-3 font-bold border-4 border-black active:scale-95 transition-all">
          COURIER FLEET PORTAL
        </button>
      </div>
    </div>
  </div>
</template>
