import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'Auth',
      component: () => import('@/views/customer/AuthView.vue'),
      meta: { requiresAuth: false }
    },
    // Customer views
    {
      path: '/cart',
      name: 'Cart',
      component: () => import('@/views/customer/CartView.vue'),
      meta: { requiresAuth: true, role: 'customer' }
    },
    {
      path: '/checkout',
      name: 'Checkout',
      component: () => import('@/views/customer/CheckoutView.vue'),
      meta: { requiresAuth: true, role: 'customer' }
    },
    {
      path: '/orders',
      name: 'OrderHistory',
      component: () => import('@/views/customer/OrderHistoryView.vue'),
      meta: { requiresAuth: true, role: 'customer' }
    },
    {
      path: '/orders/:orderCode/tracking',
      name: 'Tracking',
      component: () => import('@/views/customer/TrackingView.vue'),
      meta: { requiresAuth: true, role: 'customer' }
    },
    // Admin views under AdminLayout
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
          meta: { title: 'OPERATIONS CENTER' }
        },
        {
          path: 'products',
          name: 'Products',
          component: () => import('@/views/admin/ProductsView.vue'),
          meta: { title: 'SKU_REGISTRY' }
        },
        {
          path: 'orders',
          name: 'Orders',
          component: () => import('@/views/admin/OrdersView.vue'),
          meta: { title: 'DEPLOYMENTS' }
        },
        {
          path: 'couriers',
          name: 'Couriers',
          component: () => import('@/views/admin/CouriersView.vue'),
          meta: { title: 'FLEET_STATUS' }
        }
      ]
    },
    // Courier views under CourierLayout
    {
      path: '/courier',
      component: () => import('@/layouts/CourierLayout.vue'),
      meta: { requiresAuth: true, role: 'kurir' },
      children: [
        {
          path: '',
          redirect: '/courier/dashboard'
        },
        {
          path: 'dashboard',
          name: 'CourierDashboard',
          component: () => import('@/views/courier/CourierDashboardView.vue'),
          meta: { title: 'OPERATIVE PORTAL' }
        }
      ]
    },
    // Catchall
    {
      path: '/:pathMatch(.*)*',
      redirect: '/auth'
    }
  ]
});



router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth');
  } else if (to.meta.requiresAuth && to.meta.role && authStore.role !== to.meta.role) {
    // Redirect logic for invalid role accesses
    if (authStore.role === 'admin') {
      next('/admin/dashboard');
    } else if (authStore.role === 'kurir') {
      next('/courier/dashboard');
    } else {
      next('/cart');
    }
  } else {
    next();
  }
});

export default router;
