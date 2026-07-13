<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'login' | 'register'>('login')
const errors = ref<Record<string, string>>({})
const isLoading = ref(false)
const showPassword = ref(false)

// Lockout states
const failedAttempts = ref(0)
const isLockedOut = computed(() => failedAttempts.value >= 5)

// Reactive forms matching specifications
const loginForm = reactive({
  email: '',
  password: '',
  remember: false
})

const registerForm = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Switch tabs and reset errors
const switchTab = (tab: 'login' | 'register') => {
  activeTab.value = tab
  errors.value = {}
}

// Indonesian phone format validation
// Starts with 08, 628, or +628; followed by 8 to 11 digits (total length 10 to 14 characters)
const validatePhone = (phone: string) => {
  const phoneRegex = /^(08|\+?628|628)\d{8,11}$/
  return phoneRegex.test(phone)
}

// Password validation: min 8 characters and must contain at least one digit
const validatePassword = (pass: string) => {
  const passRegex = /^(?=.*[0-9]).{8,}$/
  return passRegex.test(pass)
}

// Email format validation
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Handle login execution
const handleLogin = async () => {
  if (isLockedOut.value) {
    showToast('CRITICAL: SECURITY ACCOUNT LOCKOUT ACTIVE')
    return
  }

  errors.value = {}

  if (!loginForm.email) {
    errors.value.email = 'IDENTIFICATION_KEY IS REQUIRED'
  } else if (!validateEmail(loginForm.email)) {
    errors.value.email = 'IDENTIFICATION_KEY FORMAT IS INVALID'
  }

  if (!loginForm.password) {
    errors.value.password = 'ENCRYPTION_PASS IS REQUIRED'
  }

  if (Object.keys(errors.value).length > 0) return

  isLoading.value = true
  try {
    await authStore.login(loginForm.email, loginForm.password)
    showToast('SESSION SUCCESSFULLY INITIATED')
  } catch (error: any) {
    console.error('Backend login API unavailable or invalid credentials:', error)
    
    // Increase failed attempts
    failedAttempts.value++

    if (failedAttempts.value >= 5) {
      errors.value.general = 'ACCOUNT_LOCKED: EXCEEDED 5 AUTHENTICATION FAILURES. CORE ENCRYPTION RESET REQUIRED.'
      showToast('ACCOUNT SHUTDOWN INITIATED')
    } else {
      errors.value.general = `ACCESS DENIED. INVALID CREDENTIALS. RETRIES REMAINING: ${5 - failedAttempts.value}`
      showToast('CREDENTIAL RETRY FAILED')
    }
  } finally {
    isLoading.value = false
  }
}

// Handle registration execution
const handleRegister = async () => {
  errors.value = {}

  // Name
  if (!registerForm.name) {
    errors.value.name = 'FULL_NAME IS REQUIRED'
  }

  // Email
  if (!registerForm.email) {
    errors.value.email = 'IDENTIFICATION_KEY IS REQUIRED'
  } else if (!validateEmail(registerForm.email)) {
    errors.value.email = 'IDENTIFICATION_KEY MUST BE A VALID EMAIL'
  }

  // Phone
  if (!registerForm.phone) {
    errors.value.phone = 'CONTACT_NUMBER IS REQUIRED'
  } else if (!validatePhone(registerForm.phone)) {
    errors.value.phone = 'CONTACT_NUMBER MUST BE A VALID INDONESIAN NUMBER (starts 08/628/+, 10-14 digits)'
  }

  // Password
  if (!registerForm.password) {
    errors.value.password = 'ENCRYPTION_PASS IS REQUIRED'
  } else if (!validatePassword(registerForm.password)) {
    errors.value.password = 'ENCRYPTION_PASS MUST BE MINIMUM 8 CHARACTERS AND CONTAIN AT LEAST 1 NUMBER'
  }

  // Confirm password
  if (registerForm.password !== registerForm.confirmPassword) {
    errors.value.confirmPassword = 'CONFIRM_PASS MUST MATCH ENCRYPTION_PASS'
  }

  if (Object.keys(errors.value).length > 0) return

  isLoading.value = true
  try {
    await authStore.register(
      registerForm.name,
      registerForm.email,
      registerForm.phone,
      registerForm.password
    )
    showToast('ACCOUNT SUCCESSFULLY CREATED')
    switchTab('login')
  } catch (error: any) {
    console.error('Backend registration API failed:', error)
    errors.value.general = 'REGISTRATION FAILED. PLEASE VERIFY DETAILS OR TRY AGAIN LATER.'
    showToast('REGISTRATION PROCESS FAILED')
  } finally {
    isLoading.value = false
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
  <div class="max-w-md mx-auto my-8 md:my-16 space-y-8 select-none">
    
    <!-- Title: PORTAL ENTRY -->
    <div class="text-center">
      <h1 class="text-4xl font-black uppercase tracking-tighter text-black select-none">
        PORTAL ENTRY<span class="text-[#CC0000]">.</span>
      </h1>
      <p class="font-mono text-xs text-gray-500 uppercase tracking-widest mt-2">
        // ACCESS_SECURITY_INTERFACE
      </p>
    </div>

    <!-- Toggle Tabs -->
    <div class="grid grid-cols-2 gap-4">
      <button 
        @click="switchTab('login')" 
        class="py-3 font-black uppercase text-sm transition-all border-4 border-black shadow-[4px_4px_0px_#000000]"
        :class="activeTab === 'login' ? 'bg-black text-white shadow-none translate-x-1 translate-y-1' : 'bg-white text-black hover:bg-gray-100'"
      >
        LOGIN_SESSION
      </button>
      <button 
        @click="switchTab('register')" 
        class="py-3 font-black uppercase text-sm transition-all border-4 border-black shadow-[4px_4px_0px_#000000]"
        :class="activeTab === 'register' ? 'bg-black text-white shadow-none translate-x-1 translate-y-1' : 'bg-white text-black hover:bg-gray-100'"
      >
        REGISTER_NODE
      </button>
    </div>

    <!-- General Error Warnings (Locked out, failed passwords) -->
    <div 
      v-if="errors.general || isLockedOut" 
      class="border-4 border-black bg-red-50 text-[#CC0000] font-mono text-xs font-bold p-4 uppercase tracking-tight shadow-[4px_4px_0px_#000000]"
    >
      {{ errors.general || 'SECURITY LOCKOUT: ACCOUNT DISABLED DUE TO 5 FAILED LOGINS. RESET REQUIRED.' }}
    </div>

    <!-- ================= FORM: LOGIN ================= -->
    <form 
      v-show="activeTab === 'login'" 
      @submit.prevent="handleLogin" 
      class="border-4 border-black p-6 space-y-5 bg-white shadow-[6px_6px_0px_#000000]"
    >
      
      <!-- IDENTIFICATION KEY (Email) -->
      <div class="space-y-1">
        <label class="block font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">
          IDENTIFICATION_KEY (EMAIL)
        </label>
        <input 
          type="email" 
          v-model="loginForm.email"
          placeholder="ENTER SYSTEM IDENTIFICATION KEY"
          class="w-full border-4 border-black p-3 focus:ring-0 font-mono text-sm placeholder-gray-400"
          :disabled="isLockedOut || isLoading"
        />
        <span v-if="errors.email" class="block text-xs font-mono text-[#CC0000] font-bold border-2 border-[#CC0000] bg-red-50 p-2 mt-1">
          > {{ errors.email }}
        </span>
      </div>

      <!-- ENCRYPTION PASS (Password) -->
      <div class="space-y-1">
        <label class="block font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">
          ENCRYPTION_PASS (PASSWORD)
        </label>
        <div class="relative flex items-center border-4 border-black bg-white">
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="loginForm.password"
            placeholder="ENTER SECURITY DECRYPT PASS"
            class="w-full border-0 p-3 pr-20 focus:ring-0 font-mono text-sm placeholder-gray-400 bg-transparent"
            :disabled="isLockedOut || isLoading"
          />
          <button 
            type="button"
            @click="togglePasswordVisibility"
            class="absolute right-3 px-3 py-1 border-2 border-black bg-white hover:bg-black hover:text-white transition-all text-xs font-mono font-bold"
            :disabled="isLockedOut || isLoading"
          >
            {{ showPassword ? 'HIDE' : 'SHOW' }}
          </button>
        </div>
        <span v-if="errors.password" class="block text-xs font-mono text-[#CC0000] font-bold border-2 border-[#CC0000] bg-red-50 p-2 mt-1">
          > {{ errors.password }}
        </span>
      </div>

      <!-- REMEMBER ME Checkbox -->
      <div class="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="rememberMe" 
          v-model="loginForm.remember"
          class="w-5 h-5 border-2 border-black rounded-none appearance-none checked:bg-black checked:border-black focus:ring-0 cursor-pointer"
          :disabled="isLockedOut || isLoading"
        />
        <label 
          for="rememberMe" 
          class="font-mono text-xs font-bold select-none cursor-pointer text-gray-600 uppercase tracking-wider"
        >
          REMEMBER_MY_NODE
        </label>
      </div>

      <!-- Submit Button -->
      <button 
        type="submit" 
        :disabled="isLockedOut || isLoading"
        class="w-full py-4 brutalist-button text-sm uppercase flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isLoading ? 'AUTHORIZING_SESSION...' : 'INITIATE_SESSION' }}</span>
      </button>

      <!-- Toggle footer text -->
      <div class="text-center font-mono text-xs text-gray-500 pt-2">
        NO ACCOUNT FOUND? 
        <button type="button" @click="switchTab('register')" class="text-black font-black underline hover:text-[#CC0000]">
          CREATE_NEW_NODE
        </button>
      </div>

    </form>

    <!-- ================= FORM: REGISTER ================= -->
    <form 
      v-show="activeTab === 'register'" 
      @submit.prevent="handleRegister" 
      class="border-4 border-black p-6 space-y-5 bg-white shadow-[6px_6px_0px_#000000]"
    >
      
      <!-- FULL_NAME -->
      <div class="space-y-1">
        <label class="block font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">
          FULL_NAME (IDENTITY)
        </label>
        <input 
          type="text" 
          v-model="registerForm.name"
          placeholder="ENTER INDIVIDUAL LEGAL NAME"
          class="w-full border-4 border-black p-3 focus:ring-0 font-mono text-sm placeholder-gray-400"
          :disabled="isLoading"
        />
        <span v-if="errors.name" class="block text-xs font-mono text-[#CC0000] font-bold border-2 border-[#CC0000] bg-red-50 p-2 mt-1">
          > {{ errors.name }}
        </span>
      </div>

      <!-- IDENTIFICATION KEY (Email) -->
      <div class="space-y-1">
        <label class="block font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">
          IDENTIFICATION_KEY (EMAIL)
        </label>
        <input 
          type="email" 
          v-model="registerForm.email"
          placeholder="ENTER SYSTEM IDENTIFICATION KEY"
          class="w-full border-4 border-black p-3 focus:ring-0 font-mono text-sm placeholder-gray-400"
          :disabled="isLoading"
        />
        <span v-if="errors.email" class="block text-xs font-mono text-[#CC0000] font-bold border-2 border-[#CC0000] bg-red-50 p-2 mt-1">
          > {{ errors.email }}
        </span>
      </div>

      <!-- CONTACT NUMBER (Phone) -->
      <div class="space-y-1">
        <label class="block font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">
          CONTACT_NUMBER (INDONESIAN PHONE)
        </label>
        <input 
          type="text" 
          v-model="registerForm.phone"
          placeholder="E.G. 08123456789 OR +628123456789"
          class="w-full border-4 border-black p-3 focus:ring-0 font-mono text-sm placeholder-gray-400"
          :disabled="isLoading"
        />
        <span v-if="errors.phone" class="block text-xs font-mono text-[#CC0000] font-bold border-2 border-[#CC0000] bg-red-50 p-2 mt-1">
          > {{ errors.phone }}
        </span>
      </div>

      <!-- ENCRYPTION PASS -->
      <div class="space-y-1">
        <label class="block font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">
          ENCRYPTION_PASS (PASSWORD)
        </label>
        <input 
          type="password" 
          v-model="registerForm.password"
          placeholder="MIN 8 CHARS + 1 NUMBER REQUIRED"
          class="w-full border-4 border-black p-3 focus:ring-0 font-mono text-sm placeholder-gray-400"
          :disabled="isLoading"
        />
        <span v-if="errors.password" class="block text-xs font-mono text-[#CC0000] font-bold border-2 border-[#CC0000] bg-red-50 p-2 mt-1">
          > {{ errors.password }}
        </span>
      </div>

      <!-- CONFIRM_PASS -->
      <div class="space-y-1">
        <label class="block font-mono text-xs font-bold text-gray-500 uppercase tracking-widest">
          CONFIRM_PASS (RE-ENCRYPT)
        </label>
        <input 
          type="password" 
          v-model="registerForm.confirmPassword"
          placeholder="RE-ENTER ENCRYPTION DECRYPT PASS"
          class="w-full border-4 border-black p-3 focus:ring-0 font-mono text-sm placeholder-gray-400"
          :disabled="isLoading"
        />
        <span v-if="errors.confirmPassword" class="block text-xs font-mono text-[#CC0000] font-bold border-2 border-[#CC0000] bg-red-50 p-2 mt-1">
          > {{ errors.confirmPassword }}
        </span>
      </div>

      <!-- Submit Button -->
      <button 
        type="submit" 
        :disabled="isLoading"
        class="w-full py-4 brutalist-button text-sm uppercase flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>{{ isLoading ? 'REGISTERING_IDENTITY...' : 'CREATE_ACCOUNT' }}</span>
      </button>

      <!-- Toggle footer text -->
      <div class="text-center font-mono text-xs text-gray-500 pt-2">
        ALREADY SECURED CREDENTIALS? 
        <button type="button" @click="switchTab('login')" class="text-black font-black underline hover:text-[#CC0000]">
          INITIATE_SESSION
        </button>
      </div>

    </form>

  </div>
</template>
