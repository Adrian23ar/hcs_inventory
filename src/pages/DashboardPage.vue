<script setup>
import { computed, onMounted } from 'vue'
import { useInventarioStore } from '@/store/inventarioStore'
import { useAuthStore } from '@/store/authStore'

const inventarioStore = useInventarioStore()
const authStore = useAuthStore()

onMounted(() => {
  inventarioStore.fetchEquipos()
})

// --- MÉTRICAS COMPUTADAS BÁSICAS ---
const totalEquipos = computed(() => inventarioStore.equipos.length)

const mantenimientosVencidos = computed(() => {
  const hoy = new Date().toISOString().split('T')[0]
  return inventarioStore.equipos.filter(e => e.proxima_fecha_mantenimiento && e.proxima_fecha_mantenimiento < hoy).length
})

// --- CÁLCULO DE DÍAS RESTANTES PARA EL PRÓXIMO MANTENIMIENTO ---
const diasProximoMantenimiento = computed(() => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const futuros = inventarioStore.equipos
    .filter(e => e.proxima_fecha_mantenimiento)
    .map(e => new Date(e.proxima_fecha_mantenimiento + 'T00:00:00'))
    .filter(d => d >= hoy)
    .sort((a, b) => a - b)

  if (futuros.length === 0) return null
  const diffTime = Math.abs(futuros[0] - hoy)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const equiposPorTipo = computed(() => {
  const conteo = {}
  inventarioStore.equipos.forEach(e => {
    const tipo = e.tipo_equipo || 'Otro'
    conteo[tipo] = (conteo[tipo] || 0) + 1
  })
  return conteo
})

const topCategorias = computed(() => {
  return Object.entries(equiposPorTipo.value)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(item => item[0])
})


// --- NUEVA LÓGICA DE ACTIVIDAD RECIENTE (Creaciones + Mantenimientos) ---
const actividadReciente = computed(() => {
  const actividades = []

  inventarioStore.equipos.forEach(equipo => {
    // 1. Extraer la fecha de creación del equipo
    let fechaCreacion = 0
    if (equipo.fecha_creacion?.seconds) {
      fechaCreacion = equipo.fecha_creacion.seconds * 1000
    } else if (equipo.fecha_creacion && typeof equipo.fecha_creacion.toDate === 'function') {
      fechaCreacion = equipo.fecha_creacion.toDate().getTime()
    }

    if (fechaCreacion > 0) {
      actividades.push({
        id: `creacion-${equipo.id}`,
        tipo_actividad: 'creacion',
        timestamp: fechaCreacion,
        equipo: equipo
      })
    }

    // 2. Extraer el historial de mantenimientos
    if (equipo.historial_mantenimiento && Array.isArray(equipo.historial_mantenimiento)) {
      equipo.historial_mantenimiento.forEach(mtto => {
        // En InventarioPage.vue guardamos el ID del mtto como Date.now().toString()
        // Esto es perfecto porque es un timestamp exacto de cuándo se hizo el registro
        const mttoTime = parseInt(mtto.id) || new Date(mtto.fecha + 'T00:00:00').getTime()

        actividades.push({
          id: `mtto-${equipo.id}-${mtto.id}`,
          tipo_actividad: 'mantenimiento',
          timestamp: mttoTime,
          equipo: equipo,
          mtto: mtto
        })
      })
    }
  })

  // Ordenar de más reciente a más viejo y tomar los 10 primeros
  return actividades.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
})

// Función para calcular "hace cuánto tiempo"
const getTimeAgo = (timestamp) => {
  const now = Date.now()
  const diff = Math.floor((now - timestamp) / 1000) // Diferencia en segundos

  if (diff < 60) return 'ahora mismo'
  const mins = Math.floor(diff / 60)
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hace 1 día'
  return `hace ${days} días`
}

// --- GRÁFICOS ---
const paletaColores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#0ea5e9', '#ec4899']

const distribucionEstilos = computed(() => {
  let total = totalEquipos.value || 1
  let currentPercent = 0
  let gradientParts = []
  let items = []
  let i = 0

  const ordenados = Object.entries(equiposPorTipo.value).sort((a, b) => b[1] - a[1])

  for (const [tipo, cantidad] of ordenados) {
    const pct = (cantidad / total) * 100
    const color = paletaColores[i % paletaColores.length]
    const start = currentPercent
    const end = currentPercent + pct
    gradientParts.push(`${color} ${start}% ${end}%`)
    items.push({ tipo, cantidad, pct, color })
    currentPercent = end
    i++
  }

  if (items.length === 0) gradientParts = ['#e2e8f0 0% 100%']

  return {
    gradient: `conic-gradient(${gradientParts.join(', ')})`,
    items: items
  }
})

const getShortName = (name) => name ? name.substring(0, 3).toUpperCase() : 'EQ'
const getColorClass = (index) => {
  const classes = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500']
  return classes[index % classes.length]
}
</script>

<template>
  <div class="flex flex-col gap-6 p-4 md:p-8 min-h-screen font-sans">

    <div class="flex flex-col mb-2">
      <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Panel de Control</p>
      <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Buen día, {{ authStore.userDetails?.nombre?.split(' ')[0] || authStore.user?.email?.split('@')[0] || 'Usuario' }}</h1>
      <p class="text-slate-500 mt-1 text-sm">Resumen del estado actual de la infraestructura.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <div class="bg-patron-olas rounded-[24px] p-6 shadow-lg relative overflow-hidden flex flex-col justify-between">

        <div class="flex justify-between items-start">
          <p class="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-1 relative z-10">Total Equipos Activos</p>
          <div class="w-8 h-8 rounded-full border border-slate-400/30 flex items-center justify-center text-emerald-400 relative z-10 bg-slate-800/20 backdrop-blur-sm">
            <i class="pi pi-box text-sm"></i>
          </div>
        </div>

        <div class="mt-2 flex items-baseline gap-3 relative z-10">
          <h3 class="text-6xl font-bold text-white">{{ totalEquipos }}</h3>
          <span class="text-emerald-400 text-xs font-medium flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> en línea
          </span>
        </div>

        <p class="text-slate-400 text-xs mt-1 mb-6 relative z-10">Equipos inventariados operando</p>
      </div>

      <div class="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mantenimientos Vencidos</p>
          <div class="w-8 h-8 rounded-full border border-rose-100 flex items-center justify-center text-rose-500 bg-rose-50/50">
            <i class="pi pi-exclamation-triangle text-sm"></i>
          </div>
        </div>

        <div class="mt-2 flex items-baseline gap-3">
          <h3 class="text-6xl font-bold" :class="mantenimientosVencidos > 0 ? 'text-rose-500' : 'text-slate-800'">{{ mantenimientosVencidos }}</h3>
          <span v-if="mantenimientosVencidos === 0" class="text-emerald-500 text-xs font-medium">Todo al día</span>
          <span v-else class="text-rose-500 text-xs font-medium">Requieren acción</span>
        </div>

        <p class="text-slate-400 text-xs mt-1 mb-6">
          <template v-if="diasProximoMantenimiento !== null">
            Próximo vencimiento en <span class="font-bold text-slate-700">{{ diasProximoMantenimiento }} días</span>
          </template>
          <template v-else>
            No hay mantenimientos programados
          </template>
        </p>

        <div class="flex gap-2 text-[10px] font-bold">
          <span class="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Al día</span>
          <span v-if="diasProximoMantenimiento !== null && diasProximoMantenimiento <= 15" class="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">Atención pronta</span>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col justify-between">
        <div class="flex justify-between items-start">
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Familias de Hardware</p>
          <div class="w-8 h-8 rounded-full border border-indigo-100 flex items-center justify-center text-indigo-500 bg-indigo-50/50">
            <i class="pi pi-table text-sm"></i>
          </div>
        </div>

        <div class="mt-2">
          <h3 class="text-6xl font-bold text-slate-800">{{ Object.keys(equiposPorTipo).length }}</h3>
        </div>

        <p class="text-slate-400 text-xs mt-1 mb-6">Diferentes tipos en el inventario</p>

        <div class="flex gap-2 mt-auto">
          <div v-for="(cat, index) in topCategorias" :key="cat" class="flex flex-col items-center justify-center gap-1.5 bg-white shadow-sm border border-slate-50 rounded-xl py-2 px-1 flex-1">
            <div class="w-5 h-5 rounded-full shadow-sm" :class="getColorClass(index)"></div>
            <span class="text-[9px] font-bold text-slate-500 uppercase truncate w-full text-center">{{ getShortName(cat) }}</span>
          </div>
          <div v-if="topCategorias.length === 0" class="text-[10px] text-slate-400 text-center w-full">Sin datos</div>
        </div>
      </div>

    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">

      <div class="bg-white/80 backdrop-blur-sm rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-sm font-bold text-slate-800 tracking-tight">Distribución por Tipo</h2>
            <p class="text-xs text-slate-400">Composición del inventario actual</p>
          </div>
          <span class="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
            <i class="pi pi-chart-pie text-[9px]"></i> En vivo
          </span>
        </div>

        <div class="flex flex-col md:flex-row items-center gap-8 mt-8">
          <div class="relative w-32 h-32 rounded-full flex items-center justify-center shadow-inner shrink-0 transition-all duration-500"
            :style="{ background: distribucionEstilos.gradient }">
            <div class="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <span class="text-[10px] font-bold text-slate-400">TOTAL</span>
              <span class="text-2xl font-bold text-slate-800 leading-none">{{ totalEquipos }}</span>
              <span class="text-[8px] text-slate-400 mt-1">equipos</span>
            </div>
          </div>

          <div class="flex-1 flex flex-col gap-4 w-full overflow-y-auto max-h-40 pr-2 custom-scrollbar">
            <div v-for="item in distribucionEstilos.items" :key="item.tipo" class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: item.color }"></div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between mb-1.5">
                  <span class="text-xs font-bold text-slate-700 truncate pr-2">{{ item.tipo }}</span>
                  <span class="text-xs font-bold text-slate-800 shrink-0">{{ item.cantidad }}</span>
                </div>
                <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-1000 ease-out"
                       :style="{ width: item.pct + '%', backgroundColor: item.color }"></div>
                </div>
              </div>
            </div>
            <div v-if="distribucionEstilos.items.length === 0" class="text-sm text-slate-400 text-center">
              Aún no hay equipos registrados.
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-sm rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-6">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-sm font-bold text-slate-800 tracking-tight">Actividad Reciente</h2>
            <p class="text-xs text-slate-400">Últimos registros e intervenciones (Top 10)</p>
          </div>
          <button class="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors bg-indigo-50 px-2 py-1 rounded-lg" @click="$router.push('/inventario')">Ver inventario</button>
        </div>

        <div class="flex flex-col gap-2.5 overflow-y-auto max-h-48 custom-scrollbar pr-2">

          <div v-for="actividad in actividadReciente" :key="actividad.id"
            class="flex justify-between items-center p-3 bg-slate-50/50 hover:bg-slate-50 hover:shadow-sm rounded-xl transition-all border border-slate-100/50">

            <div class="flex items-center gap-4 min-w-0">

              <div v-if="actividad.tipo_actividad === 'creacion'" class="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                <i class="pi pi-plus text-xs"></i>
              </div>
              <div v-else class="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <i class="pi pi-wrench text-xs"></i>
              </div>

              <div class="truncate">
                <p class="text-xs text-slate-800 truncate">
                  <span class="font-bold">
                    {{ actividad.tipo_actividad === 'creacion' ? `${actividad.equipo.tipo_equipo} agregado` : `Mtto. ${actividad.mtto.tipo}` }}
                  </span>
                </p>
                <p class="text-[10px] text-slate-400 mt-0.5 truncate">
                  {{ actividad.equipo.codigo_equipo !== 'N/A' ? actividad.equipo.codigo_equipo : actividad.equipo.modelo }} • {{ actividad.equipo.lugar }}
                </p>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span class="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                {{ getTimeAgo(actividad.timestamp) }}
              </span>
            </div>
          </div>

          <div v-if="actividadReciente.length === 0" class="text-center py-6 text-slate-400 text-sm">
            No hay actividad para mostrar.
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Scrollbar ultra fina */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}

/* Patrón de Olas Animadas (Parallax) */
.bg-patron-olas {
  background-color: #2a3f5a;
  background-image:
    url("data:image/svg+xml,%3Csvg width='120' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 Q 30 5 60 20 T 120 20' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='2'/%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg width='120' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 35 Q 30 20 60 35 T 120 35' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1.5'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: 180px 80px, 240px 100px;
  background-position: 0 bottom, 0 bottom;
  animation: olasAnimadas 15s linear infinite;
}

@keyframes olasAnimadas {
  0% {
    background-position: 0px bottom, 0px bottom;
  }
  100% {
    background-position: 180px bottom, -240px bottom;
  }
}
</style>
