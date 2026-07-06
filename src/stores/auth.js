import { defineStore } from 'pinia'
import api from '../api/axios.js'
import router from '../router/index.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** @type {any} */
    user: null,
    /** @type {string|null} */
    token: localStorage.getItem('token') || null,
    isLoggedIn: !!localStorage.getItem('token'),
    /** @type {string|null} */
    role: localStorage.getItem('role') || null
  }),

  actions: {
    async login(email, password) {
      try {
        const response = await api.post('/login', { email, password, device_name: 'web' })
        const token = response.data.token || response.data.access_token
        
        if (token) {
          this.token = token
          this.isLoggedIn = true
          localStorage.setItem('token', token)
        }

        // Fetch user data to determine the role
        await this.fetchUser()

        // Redirect based on role
        if (this.role === 'admin') {
          router.push('/admin/dashboard')
        } else if (this.role === 'kurir') {
          router.push('/courier/dashboard')
        } else {
          // Default to customer
          const intended = localStorage.getItem('intended_url')
          if (intended) {
            localStorage.removeItem('intended_url')
            router.push(intended)
          } else {
            router.push('/')
          }
        }

        return response.data
      } catch (error) {
        this.clearAuth()
        throw error
      }
    },

    async register(name, email, phone, password) {
      try {
        const response = await api.post('/register', {
          name,
          email,
          phone,
          password,
          password_confirmation: password // Standard Laravel convention
        })
        return response.data
      } catch (error) {
        throw error
      }
    },

    async logout() {
      try {
        await api.post('/logout')
      } catch (error) {
        console.error('Logout API failed, clearing local state anyway', error)
      } finally {
        this.clearAuth()
        router.push('/login')
      }
    },

    async fetchUser() {
      if (!this.token) return null
      try {
        const response = await api.get('/user')
        const userData = response.data.user || response.data
        this.user = userData
        this.role = userData.role // customer, admin, kurir
        localStorage.setItem('role', userData.role)
        this.isLoggedIn = true
        return userData
      } catch (error) {
        // If fetch user fails due to token invalidation
        this.clearAuth()
        throw error
      }
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.isLoggedIn = false
      this.role = null
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('intended_url')
    }
  }
})
