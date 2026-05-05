<script setup>
//src/pages/InventarioPage.vue
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useDialog } from 'primevue/usedialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useInventarioStore } from '@/store/inventarioStore'
import GenericFormPrompt from '@/components/GenericFormPrompt.vue'
import { exportarAExcel, exportarAPDF, formatearSpecsParaExportar } from '@/utils/exportador'
import { getErrorMessage } from '@/utils/errorHandler'
import { useBreakpoint } from '@/composables/useBreakpoint'
import { useUbicacionesStore } from '@/store/ubicacionesStore' // <--- Nuevo


const dialog = useDialog()
const toast = useToast()
const confirm = useConfirm() // <-- 2. Inicializar el servicio de confirmación
const ubicacionesStore = useUbicacionesStore() // <--- Nuevo
const inventarioStore = useInventarioStore()
const { isMobile } = useBreakpoint() // <-- 4. Usar Breakpoint
const menuRef = ref() // <-- 2. Ref para el menú de acciones
onMounted(() => {
  inventarioStore.fetchEquipos()
  ubicacionesStore.fetchUbicaciones() // <--- Nuevo
})
const valOrNA = (val) => val || 'N/A'

const columnasExportar = [
  { header: 'Código', key: 'codigo_equipo', width: 15 },
  { header: 'Serial', key: 'serial', width: 20 },
  { header: 'Tipo', key: 'tipo_equipo', width: 15 },
  { header: 'Marca', key: 'marca', width: 20 },
  { header: 'Modelo', key: 'modelo', width: 20 },
  { header: 'Lugar', key: 'lugar', width: 30 },
  { header: 'Especificaciones', key: 'especificaciones', width: 55 },
]

// Helper para ordenar (Reutilizable)
const obtenerEquiposOrdenados = () => {
  // Creamos una copia [...] para no mutar el original
  return [...inventarioStore.equipos].sort((a, b) => {
    const valA = a.codigo_equipo || '';
    const valB = b.codigo_equipo || '';
    // numeric: true ayuda a que "2" vaya antes que "10"
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });
};

const handleExportarExcel = () => {
  // 1. Usamos la lista ORDENADA
  const equiposOrdenados = obtenerEquiposOrdenados();

  const datosParaExportar = equiposOrdenados.map(equipo => { // <-- Usamos equiposOrdenados
    const specsFormateadas = formatearSpecsParaExportar(equipo.especificaciones)

    return {
      ...equipo,
      codigo_equipo: valOrNA(equipo.codigo_equipo),
      serial: valOrNA(equipo.serial),
      tipo_equipo: valOrNA(equipo.tipo_equipo),
      marca: valOrNA(equipo.marca),
      modelo: valOrNA(equipo.modelo),
      lugar: valOrNA(equipo.lugar),
      especificaciones: specsFormateadas.replace(/\n/g, ' - ')
    }
  })

  const columnasExcel = columnasExportar.map(col => {
    if (col.key === 'especificaciones') {
      return { ...col, width: 60 };
    }
    return col;
  });
  exportarAExcel('Inventario_Equipos', 'Inventario', columnasExcel, datosParaExportar)
}

const handleExportarPDF = () => {
  const headers = columnasExportar.map(col => col.header)

  // 1. Usamos la lista ORDENADA
  const equiposOrdenados = obtenerEquiposOrdenados();

  const bodyData = equiposOrdenados.map(equipo => // <-- Usamos equiposOrdenados
    columnasExportar.map(col => {
      if (col.key === 'especificaciones') {
        return formatearSpecsParaExportar(equipo.especificaciones)
      }
      return valOrNA(equipo[col.key])
    })
  )

  exportarAPDF('Inventario_Equipos', 'Inventario de Equipos HCS', headers, bodyData)
}

const abrirModalEquipo = (equipo = null) => {
  // Convertimos las ubicaciones en un formato válido para el 'select'
  const opcionesLugar = ubicacionesStore.ubicaciones.map(u => ({
    label: u.nombre,
    value: u.nombre // Guardamos el nombre en el equipo (o el id, pero el nombre es más amigable para exportar)
  }))

  // Generamos las opciones para vincular Monitores a CPUs o NVRs
  const opcionesEquiposPadre = inventarioStore.equipos
    .filter(e => e.tipo_equipo === 'CPU' || e.tipo_equipo === 'NVR / DVR')
    .map(e => ({
      label: `${e.codigo_equipo !== 'N/A' ? e.codigo_equipo : e.modelo} (${e.lugar})`,
      value: e.id // Guardaremos el ID del equipo padre
    }))

  // Agregamos una opción por defecto
  opcionesEquiposPadre.unshift({ label: 'Ninguno (Independiente)', value: '' })

  const camposDelFormulario = [
    // --- Campos Comunes (sin 'showIf') ---
    { name: 'codigo_equipo', label: 'Código de Equipo', type: 'text', placeholder: 'Ej: HCS-CPU-001 o N/A' }, // Quitamos required: true
    { name: 'serial', label: 'Serial', type: 'text', required: true, placeholder: 'Ej: 123456789' },
    {
      name: 'tipo_equipo', label: 'Tipo de Equipo', type: 'select', required: true,
      options: [
        { label: 'CPU', value: 'CPU' },
        { label: 'Monitor', value: 'Monitor' },
        { label: 'Impresora', value: 'Impresora' },
        { label: 'UPS', value: 'UPS' },
        { label: 'Access Point (AP)', value: 'Access Point' },
        { label: 'Cámara IP', value: 'Cámara IP' },
        { label: 'NVR / DVR', value: 'NVR / DVR' },
        { label: 'Switch / Router', value: 'Switch / Router' },
        { label: 'Otro', value: 'Otro' },
      ]
    },
    { name: 'marca', label: 'Marca', type: 'text', required: true, placeholder: 'Ej: Ubiquiti, MikroTik, Dell...' },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: U7 Pro, RB760iGS...' },

    // --- Ubicación (que hicimos en la Fase 2) ---
    {
      name: 'lugar',
      label: 'Lugar / Departamento',
      type: 'select',
      required: true,
      options: opcionesLugar.length > 0 ? opcionesLugar : [{ label: 'Agregue ubicaciones primero', value: '' }]
    },
    { name: 'frecuencia_mantenimiento_dias', label: 'Frecuencia de Mtto. (Días)', type: 'text', placeholder: 'Ej: 90, 180 (Opcional)' },

    // --- Campo Especial para Monitor (Relación Padre-Hijo) ---
    {
      name: 'equipo_padre_id',
      label: 'Vincular a Equipo (Padre)',
      type: 'select',
      showIf: 'Monitor',
      isNested: false, // Va en la raíz del documento, no en especificaciones
      options: opcionesEquiposPadre
    },

    // --- Campos de CPU (showIf: 'CPU') ---
    { name: 'procesador', label: 'Procesador', type: 'text', showIf: 'CPU', isNested: true, placeholder: 'Ej: Core i5-10500T' },
    { name: 'ram', label: 'RAM', type: 'text', showIf: 'CPU', isNested: true, placeholder: 'Ej: 16GB' },
    { name: 'almacenamiento', label: 'Almacenamiento', type: 'text', showIf: 'CPU', isNested: true, placeholder: 'Ej: 512GB SSD' },

    // --- Campos de Monitor (showIf: 'Monitor') ---
    { name: 'pulgadas', label: 'Pulgadas', type: 'text', showIf: 'Monitor', isNested: true, placeholder: 'Ej: 24"' },
    { name: 'hercios', label: 'Hercios (Hz)', type: 'text', showIf: 'Monitor', isNested: true, placeholder: 'Ej: 60Hz' },
    { name: 'entradas_video', label: 'Entradas de Video', type: 'text', showIf: 'Monitor', isNested: true, placeholder: 'Ej: HDMI, DisplayPort' },

    // --- Campos de Impresora (showIf: 'Impresora') ---
    {
      name: 'tipo_tinta', label: 'Tipo de Tinta', type: 'select', showIf: 'Impresora', isNested: true,
      options: [
        { label: 'Tinta Continua', value: 'Tinta Continua' },
        { label: 'Tóner', value: 'Tóner' },
        { label: 'Cartucho', value: 'Cartucho' },
      ]
    },
    { name: 'modelo_cartucho', label: 'Modelo Tinta/Cartucho/Tóner', type: 'text', showIf: 'Impresora', isNested: true, placeholder: 'Ej: HP 410A' },

    // --- Campos de UPS (showIf: 'UPS') ---
    { name: 'capacidad', label: 'Capacidad', type: 'text', showIf: 'UPS', isNested: true, placeholder: 'Ej: 1500VA / 900W' },
    { name: 'bateria', label: 'Batería', type: 'text', showIf: 'UPS', isNested: true, placeholder: 'Ej: 2x 12V/9Ah' },

    // --- Campos de Cámara IP (showIf: 'Cámara IP') ---
    { name: 'resolucion', label: 'Resolución', type: 'text', showIf: 'Cámara IP', isNested: true, placeholder: 'Ej: 2MP, 4MP' },
    { name: 'tipo_camara', label: 'Formato / Lente', type: 'text', showIf: 'Cámara IP', isNested: true, placeholder: 'Ej: Domo 2.8mm' },

    // --- Campos de NVR / DVR (showIf: 'NVR / DVR') ---
    { name: 'canales', label: 'Canales', type: 'text', showIf: 'NVR / DVR', isNested: true, placeholder: 'Ej: 16 Canales' },
    { name: 'capacidad_hdd', label: 'Capacidad HDD', type: 'text', showIf: 'NVR / DVR', isNested: true, placeholder: 'Ej: 2x 4TB' },

    // --- Campos de Access Point (showIf: 'Access Point') ---
    { name: 'tecnologia_ap', label: 'Tecnología Wi-Fi', type: 'text', showIf: 'Access Point', isNested: true, placeholder: 'Ej: Wi-Fi 6, Dual Band' },

    // --- Campos de Switch / Router (showIf: 'Switch / Router') ---
    { name: 'puertos_red', label: 'Puertos Totales', type: 'text', showIf: 'Switch / Router', isNested: true, placeholder: 'Ej: 24 Gigabit + 2 SFP' },
    { name: 'funciones_red', label: 'Funciones (PoE / VLAN)', type: 'text', showIf: 'Switch / Router', isNested: true, placeholder: 'Ej: PoE+, L2 Managed' }
  ]
  dialog.open(GenericFormPrompt, {
    props: {
      header: equipo ? `Editar: ${equipo.codigo_equipo}` : 'Agregar Nuevo Equipo',
      modal: true,
      style: isMobile.value
        ? { width: '95vw', } // En móvil
        : { width: '90vw', 'max-width': '1200px' } // En desktop
    },
    data: {
      fields: camposDelFormulario,
      // Pasamos el 'equipo' completo, que ya incluye el objeto 'especificaciones'
      initialState: equipo ? { ...equipo } : {},
      submitLabel: equipo ? 'Actualizar' : 'Guardar',
    },
    onClose: async (event) => {
      const data = event.data
      if (data) {
        // Si el usuario deja el código en blanco, forzamos que sea 'N/A'
        let codigoIngresado = data.codigo_equipo && data.codigo_equipo.trim() !== ''
          ? data.codigo_equipo.trim()
          : 'N/A'

        data.codigo_equipo = codigoIngresado

        let existeDuplicado = false

        // SOLO validamos duplicados si el código NO es N/A
        if (codigoIngresado !== 'N/A') {
          if (equipo) {
            existeDuplicado = inventarioStore.equipos.some(
              (e) => e.codigo_equipo.toUpperCase() === codigoIngresado.toUpperCase() && e.id !== equipo.id
            )
          } else {
            existeDuplicado = inventarioStore.equipos.some(
              (e) => e.codigo_equipo.toUpperCase() === codigoIngresado.toUpperCase()
            )
          }
        }

        if (existeDuplicado) {
          toast.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: `El código "${codigoIngresado}" ya existe.`,
            life: 4000,
          })
          return
        }

        try {
          if (equipo) {
            await inventarioStore.editEquipo(equipo.id, data)
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Equipo actualizado correctamente.', life: 3000 })
          } else {
            // Inyectamos el estado por defecto al crear uno nuevo
            data.estado = 'Activo'
            await inventarioStore.addEquipo(data)
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Equipo agregado al inventario.', life: 3000 })
          }
        } catch (error) {
          console.error(error);
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el equipo.', life: 3000 })
        }
      }
    },
  })
}

// --- 3. RELLENAR LA FUNCIÓN DE ELIMINAR ---
const confirmarEliminar = (equipo) => {
  confirm.require({
    header: 'Confirmar Eliminación',
    message: `¿Estás seguro de que deseas eliminar el equipo "${equipo.codigo_equipo || 'N/A'
      }"? Esta acción no se puede deshacer.`,
    icon: 'pi pi-info-circle',
    severity: 'danger',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    width: '450px',

    accept: async () => {
      try {
        await inventarioStore.removeEquipo(equipo.id)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Equipo dado de baja.', life: 3000 })
      } catch (error) {
        console.error('Error al eliminar:', error)
        toast.add({
          severity: 'error',
          summary: 'No se pudo eliminar',
          detail: getErrorMessage(error), // <--- Usamos el traductor
          life: 4000
        })
      }
    },
    // (Opcional) Función si el usuario presiona "Cancelar"
    reject: () => {
      toast.add({
        severity: 'info',
        summary: 'Cancelado',
        life: 2000,
      })
    },
  })
}
// --- LÓGICA DE MANTENIMIENTO ---
const mostrarModalMtto = ref(false)
const equipoParaMtto = ref(null)
const formMtto = ref({ fecha: '', tipo: 'Preventivo', descripcion: '' })

const abrirModalMantenimiento = (equipo) => {
  equipoParaMtto.value = equipo
  formMtto.value = {
    fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto YYYY-MM-DD
    tipo: 'Preventivo',
    descripcion: ''
  }
  mostrarModalMtto.value = true
}

const guardarMantenimiento = async () => {
  if (!formMtto.value.descripcion || !formMtto.value.fecha) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debe ingresar fecha y descripción', life: 3000 })
    return
  }

  // Clonamos el historial actual o creamos uno nuevo
  const historial = equipoParaMtto.value.historial_mantenimiento
    ? [...equipoParaMtto.value.historial_mantenimiento]
    : []

  const nuevoRegistro = {
    id: Date.now().toString(),
    fecha: formMtto.value.fecha,
    tipo: formMtto.value.tipo,
    descripcion: formMtto.value.descripcion
  }

  historial.unshift(nuevoRegistro) // Agregamos al inicio para que el nuevo salga arriba

  const actualizacion = { historial_mantenimiento: historial }

  // Cálculo de próxima fecha (igual que antes)
  if (equipoParaMtto.value.frecuencia_mantenimiento_dias) {
    const dias = parseInt(equipoParaMtto.value.frecuencia_mantenimiento_dias)
    if (!isNaN(dias)) {
      const d = new Date(formMtto.value.fecha + 'T00:00:00')
      d.setDate(d.getDate() + dias)
      actualizacion.proxima_fecha_mantenimiento = d.toISOString().split('T')[0]
    }
  }

  try {
    // 1. Guardamos en la base de datos y store
    await inventarioStore.editEquipo(equipoParaMtto.value.id, actualizacion)

    // 2. ACTUALIZACIÓN REACTIVA: Sincronizamos el objeto del modal localmente
    // Esto hace que el historial aparezca al instante sin recargar
    equipoParaMtto.value = {
      ...equipoParaMtto.value,
      ...actualizacion
    }

    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Mantenimiento registrado', life: 3000 })
    formMtto.value.descripcion = ''
  } catch (error) {
    console.error('Error al guardar mantenimiento:', error); // Log para ti como dev
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: getErrorMessage(error), // <--- Usamos el traductor
      life: 4000
    })
  }
}

const actionsMenuModel = ref([
  {
    label: 'Editar',
    icon: 'pi pi-pencil',
    command: () => abrirModalEquipo(currentItem.value)
  },
  {
    label: 'Mantenimiento',
    icon: 'pi pi-wrench',
    command: () => abrirModalMantenimiento(currentItem.value)
  },
  {
    label: 'Eliminar',
    icon: 'pi pi-trash',
    command: () => confirmarEliminar(currentItem.value)
  }
])
const currentItem = ref(null) // Para saber en qué fila se hizo clic
// Estado para el buscador global
const filters = ref({
  global: { value: null, matchMode: 'contains' }
})
const toggleActionsMenu = (event, data) => {
  currentItem.value = data // Guardamos los datos de la fila
  menuRef.value.toggle(event) // Mostramos el menú
}

const formatSpecKey = (key) => {
  const labels = {
    procesador: 'Procesador',
    ram: 'RAM',
    almacenamiento: 'Almacenamiento',
    pulgadas: 'Pulgadas',
    hercios: 'Hercios',
    entradas_video: 'Entradas de Video',
    tipo_tinta: 'Tipo de Tinta',
    modelo_cartucho: 'Modelo Cartucho',
    capacidad: 'Capacidad',
    bateria: 'Batería',
    // --- Nuevas claves ---
    resolucion: 'Resolución',
    tipo_camara: 'Formato/Lente',
    canales: 'Canales',
    capacidad_hdd: 'Discos Duros',
    tecnologia_ap: 'Tecnología Wi-Fi',
    puertos_red: 'Puertos',
    funciones_red: 'Funciones de Red'
  };

  if (labels[key]) {
    return labels[key];
  }

  return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

</script>

<template>
  <div class="rounded">
    <!-- Contenedor Principal -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

      <DataTable v-model:filters="filters"
        :globalFilterFields="['codigo_equipo', 'serial', 'marca', 'modelo', 'lugar', 'ip', 'mac_address']"
        :value="inventarioStore.equipos" :loading="inventarioStore.isLoading" paginator :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]" removableSort stripedRows tableStyle="min-width: 50rem"
        responsiveLayout="stack" breakpoint="768px" sortField="codigo_equipo" :sortOrder="1" class="p-datatable-sm p-4 text-xs">
        <!-- Encabezado Personalizado -->
        <template #header>
          <div class="flex flex-col md:flex-row justify-between items-center gap-4 p-2">
            <div>
              <h1 class="text-2xl font-bold text-slate-800">Inventario de Equipos</h1>
              <p class="text-slate-500 text-sm">Gestión de infraestructura tecnológica del hotel.</p>
            </div>

            <div class="flex flex-col md:flex-row gap-6 w-full md:w-auto">
              <!-- Buscador Estilo Imagen -->
              <div class="relative">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <InputText v-model="filters['global'].value" placeholder="Buscar equipo, serial, IP..."
                  class="!pl-10 w-full md:w-72 !text-sm border-slate-200 focus:ring-emerald-500 focus:border-emerald-500" />
              </div>

              <div class="flex gap-3 !text-sm justify-center md:justify-end ">
                <Button label="Excel" icon="pi pi-file-excel" class="!text-sm" severity="success" @click="handleExportarExcel"
                  :class="{ 'hidden md:flex': isMobile }" />
                <Button label="PDF" icon="pi pi-file-pdf" class="!text-sm" severity="danger" @click="handleExportarPDF"
                  :class="{ 'hidden md:flex': isMobile }" />
                <Button label="Nuevo" icon="pi pi-plus" class="!text-sm" @click="abrirModalEquipo()" />
              </div>
            </div>
          </div>
        </template>

        <template #empty> No se encontraron equipos. </template>
        <template #loading> Cargando datos del inventario... </template>

        <!-- Columna Código (Fondo Verde Claro) -->
        <Column field="codigo_equipo" sortable headerClass="bg-emerald-50/50"
          bodyClass="bg-emerald-50/30 font-medium text-emerald-800">
          <template #header>
            <span class="text-emerald-700">Código <span class="text-[10px] ml-1">↑↓</span></span>
          </template>
          <template #body="slotProps">
            {{ valOrNA(slotProps.data.codigo_equipo) }}
          </template>
        </Column>

        <!-- Columnas Estándar con Iconos de Ordenamiento Simplificados -->
        <Column field="serial" sortable>
          <template #header>
            <span class="text-slate-700">Serial <span class="text-slate-400 text-[10px] ml-1">↑↓</span></span>
          </template>
          <template #body="slotProps">
            {{ valOrNA(slotProps.data.serial) }}
          </template>
        </Column>

        <Column field="tipo_equipo" sortable>
          <template #header>
            <span class="text-slate-700">Tipo <span class="text-slate-400 text-[10px] ml-1">↑↓</span></span>
          </template>
          <template #body="slotProps">
            {{ valOrNA(slotProps.data.tipo_equipo) }}
          </template>
        </Column>

        <Column field="marca" sortable>
          <template #header>
            <span class="text-slate-700">Marca <span class="text-slate-400 text-[10px] ml-1">↑↓</span></span>
          </template>
          <template #body="slotProps">
            {{ valOrNA(slotProps.data.marca) }}
          </template>
        </Column>

        <Column field="modelo" header="Modelo" class="text-slate-600"></Column>

        <Column field="lugar" sortable>
          <template #header>
            <span class="text-slate-700">Lugar <span class="text-slate-400 text-[10px] ml-1">↑↓</span></span>
          </template>
          <template #body="slotProps">
            {{ valOrNA(slotProps.data.lugar) }}
          </template>
        </Column>

        <!-- Especificaciones (Texto pequeño y negritas) -->
        <Column header="Especificaciones" class="w-64">
          <template #body="slotProps">
            <div v-if="slotProps.data.especificaciones" class="flex flex-col gap-0.5">
              <div v-for="(value, key) in slotProps.data.especificaciones" :key="key" class="text-[11px] leading-tight">
                <span class="font-bold text-slate-700 capitalize">{{ formatSpecKey(key) }}:</span>
                <span class="text-slate-600">{{ value }}</span>
              </div>
            </div>
            <span v-else class="text-slate-400 italic text-xs">N/A</span>
          </template>
        </Column>

        <!-- Botón de Acción (Kebab Menu) -->
        <Column header="Acciones" :exportable="false" class="text-center">
          <template #body="slotProps">
            <Button icon="pi pi-ellipsis-v" class="p-button-text p-button-rounded text-emerald-500 hover:bg-emerald-50"
              @click="toggleActionsMenu($event, slotProps.data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Menu ref="menuRef" :model="actionsMenuModel" :popup="true" />
    <Dialog v-model:visible="mostrarModalMtto" modal
      :header="'Mantenimiento: ' + (equipoParaMtto?.codigo_equipo !== 'N/A' ? equipoParaMtto?.codigo_equipo : equipoParaMtto?.modelo)"
      :style="{ width: '90vw', maxWidth: '650px' }">
      <div class="flex flex-col gap-5 mt-2">

        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm !text-sm">
          <h3 class="font-bold text-gray-800 mb-3 text-lg">Registrar Nueva Tarea</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" v-model="formMtto.fecha"
                class="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Servicio</label>
              <select v-model="formMtto.tipo"
                class="w-full p-2 border rounded border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Preventivo">Preventivo (Limpieza, revisión)</option>
                <option value="Correctivo">Correctivo (Reparación, cambio pieza)</option>
              </select>
            </div>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción de tareas realizadas</label>
            <textarea v-model="formMtto.descripcion"
              class="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" rows="3"
              placeholder="Ej: Limpieza interna, limpieza de periféricos, actualización de firmware..."></textarea>
          </div>
          <div class="flex justify-end">
            <Button label="Guardar Registro" icon="pi pi-save" @click="guardarMantenimiento" />
          </div>
        </div>

        <div>
          <h3 class="font-bold text-gray-800 mb-3 text-lg flex justify-between items-center">
            Historial de Mantenimientos
            <span v-if="equipoParaMtto?.proxima_fecha_mantenimiento"
              class="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Próximo: {{ equipoParaMtto.proxima_fecha_mantenimiento }}
            </span>
          </h3>

          <div v-if="equipoParaMtto?.historial_mantenimiento?.length > 0"
            class="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2">
            <div v-for="mtto in equipoParaMtto.historial_mantenimiento" :key="mtto.id"
              class="p-3 border border-gray-200 rounded-lg bg-white shadow-sm relative">
              <div class="flex justify-between border-b border-gray-100 pb-2 mb-2">
                <span class="font-bold text-gray-700">{{ mtto.fecha }}</span>
                <span class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="mtto.tipo === 'Preventivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ mtto.tipo }}
                </span>
              </div>
              <p class="text-gray-600 text-sm whitespace-pre-wrap">{{ mtto.descripcion }}</p>
            </div>
          </div>
          <div v-else class="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
            <i class="pi pi-inbox text-2xl text-gray-400 mb-2"></i>
            <p class="text-sm text-gray-500">No hay mantenimientos registrados aún.</p>
          </div>
        </div>

      </div>
    </Dialog>
  </div>
</template>

<style>
.p-confirmdialog-reject-button {
  background-color: var(--p-button-secondary-background) !important;

  border: 1px solid var(--p-button-secondary-border-color) !important;
  color: var(--p-button-secondary-color) !important;

  &:hover {
    background: var(--p-button-secondary-hover-background) !important;
    border: 1px solid var(--p-button-secondary-hover-border-color) !important;
    color: var(--p-button-secondary-hover-color) !important;
  }

}

.p-dialog.p-component.p-confirmdialog {
  max-width: 95vw !important;
}

.p-menu-item-link{
    padding: 0.35rem 0.60rem !important;
    font-size: 14px !important;
  }
@media (max-width: 768px) {
  .p-datatable-stacked .p-datatable-tbody>tr>td .p-column-title {
    font-weight: 600;
    margin-right: 0.5rem;
    color: var(--p-text-color);
  }

  .p-datatable-stacked .p-datatable-tbody>tr>td {
    border: 0;
    border-bottom: 1px solid var(--p-surface-d);
  }

  .p-datatable-stacked .p-datatable-tbody>tr {
    margin-bottom: 1rem;
    border: 1px solid var(--p-surface-d);
    border-radius: 6px;
  }

  .p-menu-item-link{
    padding: 0.25rem 0.50rem !important;
    font-size: 12px !important;
  }
}
</style>
