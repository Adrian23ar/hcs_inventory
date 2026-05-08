<script setup>
//src/components/layout/AppLayout.vue
import { ref } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
import Sidebar from 'primevue/sidebar'
import Button from 'primevue/button'

const authStore = useAuthStore()
const mobileVisible = ref(false)
const desktopExpanded = ref(true)
const route = useRoute()

const isRouteActive = (path) => route.path === path

const navLinks = [
  { label: 'Dashboard', path: '/', icon: 'pi pi-home' },
  { label: 'Inventario', path: '/inventario', icon: 'pi pi-box' },
  { label: 'Ubicaciones', path: '/ubicaciones', icon: 'pi pi-map-marker' },
]
</script>

<template>
  <div class="min-h-screen flex overflow-hidden bg-gradient-to-br from-[#e0eefa] to-[#edeff8]">

    <aside
      class="hidden lg:flex flex-col bg-white fixed h-full z-20 border-r border-slate-200 transition-all duration-300"
      :class="desktopExpanded ? 'w-64' : 'w-20'">
      <div class="h-16 flex items-center px-4 border-b border-slate-100" :class="!desktopExpanded && 'justify-center'">
        <div class="flex items-center gap-3 overflow-hidden">
          <div
            class="min-w-[2rem] w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <i class="pi pi-bolt text-white text-sm"></i>
          </div>
          <span
            class="text-lg font-extrabold text-slate-900 tracking-tight whitespace-nowrap transition-opacity duration-200"
            :class="desktopExpanded ? 'opacity-100' : 'opacity-0 hidden'">
            HCS Inv.
          </span>
        </div>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        <RouterLink v-for="link in navLinks" :key="link.path" :to="link.path"
          class="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group" :class="[
            isRouteActive(link.path)
              ? 'bg-slate-900 text-white font-semibold shadow-md'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
            !desktopExpanded && 'justify-center px-0'
          ]" :title="!desktopExpanded ? link.label : ''">
          <i :class="[link.icon, isRouteActive(link.path) ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-600']"
            class="text-xl transition-colors min-w-[1.25rem] text-center"></i>
          <span class="text-sm whitespace-nowrap transition-opacity duration-200"
            :class="desktopExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'">{{ link.label }}</span>
        </RouterLink>

        <div v-if="authStore.userRole === 'admin'" class="pt-6">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 whitespace-nowrap"
            :class="desktopExpanded ? 'px-3 text-left' : 'px-0 text-center'">
            {{ desktopExpanded ? 'Administración' : '' }}
          </p>
          <RouterLink to="/admin/usuarios"
            class="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group" :class="[
              isRouteActive('/admin/usuarios')
                ? 'bg-slate-900 text-white font-semibold shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              !desktopExpanded && 'justify-center px-0'
            ]" :title="!desktopExpanded ? 'Usuarios' : ''">
            <i class="pi pi-users text-xl transition-colors min-w-[1.25rem] text-center"
              :class="isRouteActive('/admin/usuarios') ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-600'"></i>
            <span class="text-sm whitespace-nowrap transition-opacity duration-200"
              :class="desktopExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'">Gestión de Usuarios</span>
          </RouterLink>
        </div>
      </nav>

      <div class="p-3 border-t border-slate-100 flex flex-col gap-2">
        <div class="flex items-center gap-3 p-2 rounded-xl" :class="!desktopExpanded && 'justify-center'">
          <div
            class="min-w-[2.25rem] w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shrink-0">
            <i class="pi pi-user text-sm"></i>
          </div>
          <div class="flex flex-col min-w-0 transition-opacity"
            :class="desktopExpanded ? 'opacity-100' : 'opacity-0 hidden'">
            <span class="text-xs font-bold text-slate-800 truncate">{{ authStore.userDetails?.nombre }}</span>
            <span class="text-[10px] text-slate-500 truncate text-ellipsis">{{ authStore.user?.email }}</span>
          </div>
        </div>
        <Button icon="pi pi-sign-out" :label="desktopExpanded ? 'Cerrar Sesión' : ''"
          class="!w-full !text-slate-500 hover:!text-rose-600 hover:!bg-rose-50 !bg-transparent !border-none transition-colors text-center"
          :class="desktopExpanded ? ' !p-2' : '!justify-center !p-2'" @click="authStore.logout()" />
      </div>
    </aside>

    <div class="flex-1 flex flex-col transition-all duration-300 h-screen overflow-y-auto"
      :class="desktopExpanded ? 'lg:ml-64' : 'lg:ml-20'">

      <header
        class="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
        <div class="flex items-center gap-4">
          <Button icon="pi pi-bars" text rounded @click="desktopExpanded = !desktopExpanded"
            class="!hidden lg:!inline-flex !text-slate-600 hover:!bg-slate-100" />

          <Button icon="pi pi-bars" text rounded @click="mobileVisible = true"
            class="lg:!hidden !text-slate-600 hover:!bg-slate-100" />

          <div class="lg:hidden flex items-center gap-2">
            <div class="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <i class="pi pi-bolt text-white text-xs"></i>
            </div>
            <span class="font-extrabold text-slate-900 tracking-tight">HCS</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm text-slate-600 font-medium hidden sm:block">{{ authStore.user?.email }}</span>
        </div>
      </header>

      <Sidebar v-model:visible="mobileVisible" class="!bg-white !w-72">
        <template #header>
          <span class="text-slate-900 font-extrabold tracking-tight text-xl">Menú</span>
        </template>
        <nav class="flex flex-col justify-between gap-1.5 mt-4">
          <div>
            <div>
              <RouterLink v-for="link in navLinks" :key="link.path" :to="link.path" @click="mobileVisible = false"
                class="flex items-center gap-3 p-3 rounded-xl transition-all group"
                :class="isRouteActive(link.path) ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'">
                <i :class="[link.icon, isRouteActive(link.path) ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-600']"
                  class="text-lg"></i>
                <span class="text-sm font-medium">{{ link.label }}</span>
              </RouterLink>
            </div>

            <div v-if="authStore.userRole === 'admin'" class="pt-6">
              <p class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Administración</p>
              <RouterLink to="/admin/usuarios" @click="mobileVisible = false"
                class="flex items-center gap-3 p-3 rounded-xl transition-all group"
                :class="isRouteActive('/admin/usuarios') ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'">
                <i class="pi pi-users text-lg transition-colors"
                  :class="isRouteActive('/admin/usuarios') ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-600'"></i>
                <span class="text-sm font-medium">Gestión de Usuarios</span>
              </RouterLink>
            </div>
          </div>

          <div class="border-t pt-4">
            <Button icon="pi pi-sign-out border-slate-200" :label="desktopExpanded ? 'Cerrar Sesión' : ''"
              class="!w-full !text-red-500 !bg-red-50 hover:!text-rose-600 !text-xs hover:!bg-rose-50 !border-none transition-colors"
              @click="authStore.logout()" />
          </div>

        </nav>
      </Sidebar>

      <main class=" p-4 md:p-8 ">
        <div class=" mx-auto">
          <RouterView />
        </div>
      </main>

    </div>
  </div>
</template>
