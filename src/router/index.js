import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

// Import views
import HomeView from '../views/customer/HomeView.vue'
import CatalogView from '../views/customer/CatalogView.vue'
import ProductDetailView from '../views/customer/ProductDetailView.vue'
import AuthView from '../views/customer/AuthView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: false }
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: CatalogView,
    meta: { requiresAuth: false }
  },
  {
    path: '/product/:slug',
    name: 'product-detail',
    component: ProductDetailView,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'login',
    component: AuthView,
    meta: { guestOnly: true }
  },
  // Catch-all route redirecting to home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Make sure to fetch user if logged in but state is empty
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchUser()
    } catch (e) {
      console.error('Session expired or token invalid')
    }
  }

  const isAuthenticated = authStore.isLoggedIn

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Save intended URL
    localStorage.setItem('intended_url', to.fullPath)
    next('/login')
  } else if (to.meta.guestOnly && isAuthenticated) {
    // Redirect logged-in users away from login page
    next('/')
  } else {
    next()
  }
})

export default router
