<script setup>
//src/pages/InventarioPage.vue
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu' // <-- 2. Importar Menu
import Column from 'primevue/column'
import { useDialog } from 'primevue/usedialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm' // <-- 1. Importar useConfirm
import { useInventarioStore } from '@/store/inventarioStore'
import GenericFormPrompt from '@/components/GenericFormPrompt.vue'
import { exportarAExcel, exportarAPDF, formatearSpecsParaExportar } from '@/utils/exportador'
import { useBreakpoint } from '@/composables/useBreakpoint'

const dialog = useDialog()
const toast = useToast()
const confirm = useConfirm() // <-- 2. Inicializar el servicio de confirmación
const inventarioStore = useInventarioStore()
const { isMobile } = useBreakpoint() // <-- 4. Usar Breakpoint
const menuRef = ref() // <-- 2. Ref para el menú de acciones
onMounted(() => {
  inventarioStore.fetchEquipos()
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
  const camposDelFormulario = [
    // --- Campos Comunes (sin 'showIf') ---
    { name: 'codigo_equipo', label: 'Código de Equipo', type: 'text', required: true, placeholder: 'Ej: HCS-CPU-001' },
    {
      name: 'serial',
      label: 'Serial',
      type: 'text',
      required: true,
      placeholder: 'Ej: 123456789'
    },
    {
      name: 'tipo_equipo', label: 'Tipo de Equipo', type: 'select', required: true,
      options: [
        { label: 'CPU', value: 'CPU' },
        { label: 'Monitor', value: 'Monitor' },
        { label: 'Impresora', value: 'Impresora' },
        { label: 'UPS', value: 'UPS' },
        { label: 'Otro', value: 'Otro' },
      ]
    },
    { name: 'marca', label: 'Marca', type: 'text', required: true },
    { name: 'modelo', label: 'Modelo', type: 'text', placeholder: 'Ej: Optiplex 3080' },
    { name: 'lugar', label: 'Lugar / Departamento', type: 'text', required: true, placeholder: 'Ej: Oficina RRHH' },

    // --- Campos de CPU (showIf: 'CPU', isNested: true) ---
    { name: 'procesador', label: 'Procesador', type: 'text', showIf: 'CPU', isNested: true, placeholder: 'Ej: Core i5-10500T' },
    { name: 'ram', label: 'RAM', type: 'text', showIf: 'CPU', isNested: true, placeholder: 'Ej: 16GB' },
    { name: 'almacenamiento', label: 'Almacenamiento', type: 'text', showIf: 'CPU', isNested: true, placeholder: 'Ej: 512GB SSD' },

    // --- Campos de Monitor (showIf: 'Monitor', isNested: true) ---
    { name: 'pulgadas', label: 'Pulgadas', type: 'text', showIf: 'Monitor', isNested: true, placeholder: 'Ej: 24"' },
    { name: 'hercios', label: 'Hercios (Hz)', type: 'text', showIf: 'Monitor', isNested: true, placeholder: 'Ej: 60Hz' },
    { name: 'entradas_video', label: 'Entradas de Video', type: 'text', showIf: 'Monitor', isNested: true, placeholder: 'Ej: HDMI, VGA' },

    // --- Campos de Impresora (showIf: 'Impresora', isNested: true) ---
    {
      name: 'tipo_tinta', label: 'Tipo de Tinta', type: 'select', showIf: 'Impresora', isNested: true,
      options: [
        { label: 'Tinta Continua', value: 'Tinta Continua' },
        { label: 'Tóner', value: 'Tóner' },
        { label: 'Cartucho', value: 'Cartucho' },
      ]
    },
    { name: 'modelo_cartucho', label: 'Modelo Tinta/Cartucho/Tóner', type: 'text', showIf: 'Impresora', isNested: true, placeholder: 'Ej: HP 410A' },

    // --- Campos de UPS (showIf: 'UPS', isNested: true) ---

    { name: 'capacidad', label: 'Capacidad', type: 'text', showIf: 'UPS', isNested: true, placeholder: 'Ej: 1500VA / 900W' },
    { name: 'bateria', label: 'Batería', type: 'text', showIf: 'UPS', isNested: true, placeholder: 'Ej: 2x 12V/9Ah' },

  ]
  dialog.open(GenericFormPrompt, {
    props: {
      header: equipo ? `Editar: ${equipo.codigo_equipo}` : 'Agregar Nuevo Equipo',
      modal: true,
      style: isMobile.value
        ? { width: '95vw' } // En móvil
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

        const codigoIngresado = data.codigo_equipo
        let existeDuplicado = false

        if (equipo) {
          // Estamos EDITANDO
          // Buscamos si existe otro equipo (diferente ID) con el mismo código
          existeDuplicado = inventarioStore.equipos.some(
            (e) => e.codigo_equipo === codigoIngresado && e.id !== equipo.id
          )
        } else {
          // Estamos CREANDO
          // Buscamos si ya existe algún equipo con ese código
          existeDuplicado = inventarioStore.equipos.some(
            (e) => e.codigo_equipo === codigoIngresado
          )
        }

        if (existeDuplicado) {
          toast.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: `El código "${codigoIngresado}" ya existe`,
            life: 4000,
          })
          return
        }

        try {
          if (equipo) {
            await inventarioStore.editEquipo(equipo.id, data)
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Equipo actualizado correctamente.', life: 3000, })
          } else {
            await inventarioStore.addEquipo(data)
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Equipo agregado al inventario.', life: 3000, })
          }
        } catch (error) {
          console.error(error);
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el equipo.', life: 3000, })
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
        toast.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Equipo eliminado.',
          life: 3000,
        })
      } catch (error) {
        console.error(error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el equipo.',
          life: 3000,
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

const actionsMenuModel = ref([
  {
    label: 'Editar',
    icon: 'pi pi-pencil',
    command: () => {
      // 'currentItem' se setea en toggleActionsMenu
      abrirModalEquipo(currentItem.value)
    }
  },
  {
    label: 'Eliminar',
    icon: 'pi pi-trash',
    command: () => {
      confirmarEliminar(currentItem.value)
    }
  }
])
const currentItem = ref(null) // Para saber en qué fila se hizo clic
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
    bateria: 'Batería'
  };

  if (labels[key]) {
    return labels[key];
  }

  // Fallback
  return key.replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-1 border border-gray-200">
    <DataTable :value="inventarioStore.equipos" :loading="inventarioStore.isLoading" paginator :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]" removableSort stripedRows tableStyle="min-width: 50rem"
      responsiveLayout="stack" breakpoint="768px" sortField="codigo_equipo" :sortOrder="1">
      <template #header>
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Inventario de Equipos</h1>
            <p class="text-gray-500">Gestión de CPUs, Monitores e Impresoras del hotel.</p>
          </div>
          <div class="flex gap-2">
            <div class="flex gap-2" :class="{ 'hidden md:flex': isMobile }">
              <Button label="Excel" icon="pi pi-file-excel" severity="success" @click="handleExportarExcel" />
              <Button label="PDF" icon="pi pi-file-pdf" severity="danger" @click="handleExportarPDF" />
            </div>
            <Button label="Nuevo Equipo" icon="pi pi-plus" @click="abrirModalEquipo()" />
          </div>
        </div>
      </template>

      <template #empty> No se encontraron equipos. </template>
      <template #loading> Cargando datos del inventario... </template>

      <Column field="codigo_equipo" header="Código" sortable style="width: 10%">
        <template #body="slotProps">
          {{ valOrNA(slotProps.data.codigo_equipo) }}
        </template>
      </Column>

      <Column field="serial" header="Serial" sortable style="width: 15%">
        <template #body="slotProps">
          {{ valOrNA(slotProps.data.serial) }}
        </template>
      </Column>

      <Column field="tipo_equipo" header="Tipo" sortable style="width: 15%">
        <template #body="slotProps">
          {{ valOrNA(slotProps.data.tipo_equipo) }}
        </template>
      </Column>

      <Column field="marca" header="Marca" sortable style="width: 15%">
        <template #body="slotProps">
          {{ valOrNA(slotProps.data.marca) }}
        </template>
      </Column>

      <Column field="modelo" header="Modelo" style="width: 15%">
        <template #body="slotProps">
          {{ valOrNA(slotProps.data.modelo) }}
        </template>
      </Column>

      <Column field="lugar" header="Lugar" sortable style="width: 15%">
        <template #body="slotProps">
          {{ valOrNA(slotProps.data.lugar) }}
        </template>
      </Column>

      <Column header="Especificaciones" style="width: 20%">
        <template #body="slotProps">
          <div v-if="slotProps.data.especificaciones">
            <span v-for="(value, key) in slotProps.data.especificaciones" :key="key" class="block text-sm">
              <strong>{{ formatSpecKey(key) }}:</strong> {{ value }}
            </span>
          </div>
          <span v-else>N/A</span>
        </template>
      </Column>

      <Column header="Acciones" :exportable="false" style="width: 10%">
        <template #body="slotProps">
          <Button icon="pi pi-ellipsis-v" text rounded aria-haspopup="true" aria-controls="actions_menu"
            @click="toggleActionsMenu($event, slotProps.data)" />
        </template>
      </Column>
    </DataTable>

    <Menu ref="menuRef" :model="actionsMenuModel" :popup="true" />
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
}
</style>
