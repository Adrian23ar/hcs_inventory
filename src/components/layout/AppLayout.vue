<script setup>
import { ref } from 'vue'
// 1. RouterLink es necesario para la navegación
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
import Sidebar from 'primevue/sidebar'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
// 2. Ya no necesitamos 'Menu' ni 'menuItems'
// import Menu from 'primevue/menu'

const authStore = useAuthStore()
const visible = ref(false)
const route = useRoute() // 3. Importamos 'useRoute' para saber la ruta activa

// 4. Helper para saber si la ruta está activa (para los estilos)
const isRouteActive = (path) => {
  return route.path === path
}
</script>

<template>
  <div>
    <Sidebar class="!w-full md:!w-[21rem]" v-model:visible="visible" header="HCS Inventario">

      <nav class="flex flex-col p-2">
        <RouterLink to="/" class="flex items-center gap-3 p-3 rounded-md transition-colors duration-200" :class="[
          isRouteActive('/')
            ? 'bg-green-100 text-green-700 font-semibold'
            : 'text-gray-700 hover:bg-gray-100'
        ]" @click="visible = false">
          <i class="pi pi-home text-xl"></i>
          <span class="text-base">Dashboard</span>
        </RouterLink>
        <RouterLink to="/inventario" class="flex items-center gap-3 p-3 rounded-md transition-colors duration-200" :class="[
          isRouteActive('/inventario')
            ? 'bg-green-100 text-green-700 font-semibold'
            : 'text-gray-700 hover:bg-gray-100'
        ]" @click="visible = false">
          <i class="pi pi-box text-xl"></i>
          <span class="text-base">Inventario</span>
        </RouterLink>
        <RouterLink to="/ubicaciones" class="flex items-center gap-3 p-3 rounded-md transition-colors duration-200" :class="[
          isRouteActive('/ubicaciones')
            ? 'bg-green-100 text-green-700 font-semibold'
            : 'text-gray-700 hover:bg-gray-100'
        ]" @click="visible = false">
          <i class="pi pi-map-marker text-xl"></i>
          <span class="text-base">Ubicaciones</span>
        </RouterLink>

        <RouterLink v-if="authStore.userRole === 'admin'" to="/admin/usuarios"
          class="flex items-center gap-3 p-3 rounded-md transition-colors duration-200 mt-1" :class="[
            isRouteActive('/admin/usuarios')
              ? 'bg-green-100 text-green-700 font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          ]" @click="visible = false">
          <i class="pi pi-users text-xl"></i>
          <span class="text-base">Gestión de Usuarios</span>
        </RouterLink>
      </nav>

      <template #footer>
        <Button label="Cerrar Sesión" icon="pi pi-sign-out" severity="danger" text class="w-full"
          @click="authStore.logout()" />
      </template>
    </Sidebar>

    <div class="p-4 transition-all duration-300" :class="{ 'md:pl-[21rem]': visible }">
      <Toolbar class="mb-4">
        <template #start>
          <Button icon="pi pi-bars" text rounded @click="visible = !visible" />
        </template>
        <template #end>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">{{
              authStore.user?.email
            }}</span>
            <i class="pi pi-user"></i>
          </div>
        </template>
      </Toolbar>
      <main class="container mx-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style>
/* Ajuste para que el layout principal se mueva cuando el Sidebar aparece */
.pl-\[21rem\] {
  padding-left: 21rem;
}

/* 3. Cambiamos el selector de .p-sidebar-left a .p-Sidebar-left */
.p-Sidebar-left {
  width: 20rem !important;
}
</style>
