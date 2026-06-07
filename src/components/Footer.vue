<template>
  <footer class="w-full bg-black text-white border-t-4 border-[#CC0000]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        
        <!-- Brand & Tagline -->
        <div class="md:col-span-4 space-y-4">
          <router-link to="/" class="text-4xl font-black uppercase tracking-tighter text-white">
            KETCE<span class="text-[#CC0000]">.</span>
          </router-link>
          <div class="inline-block border-2 border-white px-3 py-1 font-mono text-xs font-bold bg-[#CC0000] text-white tracking-widest select-none">
            AUTHENTIC_LOGISTICS
          </div>
          <p class="text-sm font-medium text-gray-400 leading-relaxed max-w-sm mt-4">
            Next-generation clinical-brutalist fashion ecosystem with proprietary in-house logistics.
          </p>
        </div>

        <!-- Column 1: About -->
        <div class="md:col-span-3 space-y-4">
          <h3 class="text-md font-bold uppercase tracking-tight border-b-2 border-white pb-2 text-white">
            ABOUT_SYSTEM
          </h3>
          <p class="text-sm text-gray-400 leading-relaxed">
            Ketce operates under strict design and distribution guidelines, ensuring direct delivery via our dedicated in-house courier network.
          </p>
        </div>

        <!-- Column 2: Links -->
        <div class="md:col-span-2 space-y-4">
          <h3 class="text-md font-bold uppercase tracking-tight border-b-2 border-white pb-2 text-white">
            CORE_LINKS
          </h3>
          <ul class="space-y-2 font-mono text-xs text-gray-400">
            <li>
              <router-link to="/catalog" class="hover:text-[#CC0000] transition-colors">
                > CATALOGUE_VIEW
              </router-link>
            </li>
            <li>
              <a href="#" class="hover:text-[#CC0000] transition-colors">
                > PRIVACY_PROTOCOL
              </a>
            </li>
            <li>
              <a href="#" class="hover:text-[#CC0000] transition-colors">
                > TERMS_OF_SERVICE
              </a>
            </li>
            <li>
              <a href="#" class="hover:text-[#CC0000] transition-colors">
                > SHIPPING_INFO
              </a>
            </li>
          </ul>
        </div>

        <!-- Column 3: Contact -->
        <div class="md:col-span-3 space-y-4">
          <h3 class="text-md font-bold uppercase tracking-tight border-b-2 border-white pb-2 text-white">
            CONTACT_NODE
          </h3>
          <ul class="space-y-2 font-mono text-xs text-gray-400">
            <li class="flex items-center space-x-2">
              <span class="font-bold text-white">EMAIL:</span>
              <span>support@ketce.system</span>
            </li>
            <li class="flex items-center space-x-2">
              <span class="font-bold text-white">PHONE:</span>
              <span>+62 21 8080 KETCE</span>
            </li>
            <li class="flex items-start space-x-2">
              <span class="font-bold text-white">ADDR:</span>
              <span>SECTOR_09, INDUSTRIAL DISTRICT, ID</span>
            </li>
          </ul>
        </div>

      </div>

      <!-- Copyright Notice -->
      <div class="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between font-mono text-xs text-gray-500">
        <div>
          © 2025 KETCE. ALL RIGHTS RESERVED.
        </div>
        <div class="mt-4 md:mt-0 flex space-x-4">
          <span>SYSTEM_STATUS: ACTIVE</span>
          <span>BUILD: v1.0.4-BRUTAL</span>
        </div>
      </div>

    </div>
  </footer>
</template>
