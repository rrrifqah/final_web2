import { defineStore } from 'pinia'
import api from '../api/axios.js'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    totalItems: 0
  }),

  actions: {
    async fetchCart() {
      try {
        const response = await api.get('/cart')
        // Adapt to API formats (array directly, or wrapped in data/cart/items)
        const cartData = response.data.cart || response.data
        this.items = Array.isArray(cartData) ? cartData : (cartData.items || [])
        
        // Sum total quantities or use backend-provided totalItems
        if (response.data.totalItems !== undefined) {
          this.totalItems = response.data.totalItems
        } else if (cartData.total_items !== undefined) {
          this.totalItems = cartData.total_items
        } else {
          this.totalItems = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        }
        
        return response.data
      } catch (error) {
        console.error('Failed to fetch cart', error)
        // Reset state on failure
        this.items = []
        this.totalItems = 0
        throw error
      }
    },

    async addToCart(productId, quantity = 1) {
      try {
        const response = await api.post('/cart', {
          product_id: productId,
          quantity
        })
        await this.fetchCart()
        return response.data
      } catch (error) {
        console.error('Failed to add to cart', error)
        throw error
      }
    },

    async removeFromCart(cartId) {
      try {
        const response = await api.delete(`/cart/${cartId}`)
        await this.fetchCart()
        return response.data
      } catch (error) {
        console.error('Failed to remove from cart', error)
        throw error
      }
    },

    async updateQuantity(cartId, quantity) {
      try {
        const response = await api.put(`/cart/${cartId}`, { quantity })
        await this.fetchCart()
        return response.data
      } catch (error) {
        console.error('Failed to update cart quantity', error)
        throw error
      }
    }
  }
})
