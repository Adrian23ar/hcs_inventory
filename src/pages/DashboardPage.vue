<script setup>
import { computed, onMounted } from 'vue'
import { useInventarioStore } from '@/store/inventarioStore'

const inventarioStore = useInventarioStore()

onMounted(() => {
  inventarioStore.fetchEquipos()
})

// --- MÉTRICAS COMPUTADAS ---
const totalEquipos = computed(() => inventarioStore.equipos.length)

const mantenimientosVencidos = computed(() => {
  const hoy = new Date().toISOString().split('T')[0]
  return inventarioStore.equipos.filter(e => e.proxima_fecha_mantenimiento && e.proxima_fecha_mantenimiento < hoy).length
})

const equiposPorTipo = computed(() => {
  const conteo = {}
  inventarioStore.equipos.forEach(e => {
    conteo[e.tipo_equipo] = (conteo[e.tipo_equipo] || 0) + 1
  })
  return conteo
})

const equiposRecientes = computed(() => {
  // Simplemente mostramos los últimos 5 agregados al array
  return [...inventarioStore.equipos].slice(-5).reverse()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-800">Panel de Control</h1>
      <p class="text-gray-500">Resumen del estado actual de la infraestructura.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
        <div class="bg-blue-100 text-blue-600 p-3 rounded-lg"><i class="pi pi-server text-2xl"></i></div>
        <div>
          <p class="text-sm text-gray-500 font-medium">Total de Equipos Activos</p>
          <p class="text-2xl font-bold text-gray-800">{{ totalEquipos }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
        <div class="bg-red-100 text-red-600 p-3 rounded-lg"><i class="pi pi-exclamation-triangle text-2xl"></i></div>
        <div>
          <p class="text-sm text-gray-500 font-medium">Mantenimientos Vencidos</p>
          <p class="text-2xl font-bold text-gray-800">{{ mantenimientosVencidos }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
        <div class="bg-green-100 text-green-600 p-3 rounded-lg"><i class="pi pi-sitemap text-2xl"></i></div>
        <div>
          <p class="text-sm text-gray-500 font-medium">Categorías de Hardware</p>
          <p class="text-2xl font-bold text-gray-800">{{ Object.keys(equiposPorTipo).length }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Distribución por Tipo</h2>
        <div class="flex flex-col gap-3">
          <div v-for="(cantidad, tipo) in equiposPorTipo" :key="tipo" class="flex justify-between items-center">
            <span class="text-gray-600 font-medium">{{ tipo }}</span>
            <span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-bold">{{ cantidad }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Últimos Registros</h2>
        <div class="flex flex-col gap-3">
          <div v-for="equipo in equiposRecientes" :key="equipo.id" class="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
            <div>
              <p class="font-bold text-sm text-gray-800">{{ equipo.codigo_equipo !== 'N/A' ? equipo.codigo_equipo : equipo.modelo }}</p>
              <p class="text-xs text-gray-500">{{ equipo.tipo_equipo }} - {{ equipo.lugar }}</p>
            </div>
            <span class="text-xs text-blue-500 font-medium whitespace-nowrap">{{ equipo.marca }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
