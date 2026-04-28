// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/authStore'

import AppLayout from '@/components/layout/AppLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { requiresAuth: false },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/pages/ResetPasswordPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '', // La ruta por defecto será el Dashboard
          name: 'dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
        },
        {
          path: '/inventario',
          name: 'inventario',
          component: () => import('@/pages/InventarioPage.vue'),
        },
        {
          path: 'ubicaciones',
          name: 'ubicaciones',
          component: () => import('@/pages/UbicacionesPage.vue'),
        },
        {
          path: 'admin/usuarios',
          name: 'admin-usuarios',
          component: () => import('@/pages/admin/GestionUsuariosPage.vue'),
          meta: { requiresRole: 'admin' },
        },
      ],
    },
  ],
})

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  if (!authStore.isInitialized) {
    await authStore.init()
  }
  const isAuthenticated = authStore.isLoggedIn
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && isAuthenticated) {
    return { name: 'inventario' }
  }

  if (to.meta.requiresRole && authStore.userRole !== to.meta.requiresRole) {
    return { name: 'inventario' }
  }

  return true
})

export default router
