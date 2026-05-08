<script setup>
// src/pages/UbicacionesPage.vue
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Menu from 'primevue/menu'
import { useDialog } from 'primevue/usedialog'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useUbicacionesStore } from '@/store/ubicacionesStore'
import GenericFormPrompt from '@/components/GenericFormPrompt.vue'
import { getErrorMessage } from '@/utils/errorHandler'

const dialog = useDialog()
const toast = useToast()
const confirm = useConfirm()
const ubicacionesStore = useUbicacionesStore()
const menuRef = ref()
const currentItem = ref(null)

onMounted(() => {
  ubicacionesStore.fetchUbicaciones()
})

const abrirModalUbicacion = (ubicacion = null) => {
  const opcionesPisos = [
    { label: 'Planta Baja', value: 'Planta Baja' },
    { label: 'Mezzanina', value: 'Mezzanina' },
    { label: 'P1', value: 'P1' },
    { label: 'P2', value: 'P2' },
    { label: 'P3', value: 'P3' },
    { label: 'P4', value: 'P4' },
    { label: 'P5', value: 'P5' },
    { label: 'P6', value: 'P6' },
    { label: 'P7', value: 'P7' },
    { label: 'P8', value: 'P8' },
    { label: 'Piso 1', value: 'Piso 1' },
    { label: 'Piso 2', value: 'Piso 2' },
    { label: 'Piso 3', value: 'Piso 3' },
    { label: 'Piso 4', value: 'Piso 4' },
    { label: 'Piso 5', value: 'Piso 5' },
    { label: 'Piso 6', value: 'Piso 6' },
    { label: 'Piso 7', value: 'Piso 7' },
    { label: 'Piso 8', value: 'Piso 8' },
    { label: 'Piso 9', value: 'Piso 9' },
    { label: 'Piso 10', value: 'Piso 10' },
    { label: 'Piso 11', value: 'Piso 11' },
    { label: 'PH', value: 'PH' }
  ];

  dialog.open(GenericFormPrompt, {
    props: {
      header: ubicacion ? `Editar Ubicación` : 'Nueva Ubicación',
      modal: true,
      style: { width: '90vw', 'max-width': '600px' }
    },
    data: {
      fields: [
        { name: 'nombre', label: 'Nombre de la Ubicación', type: 'text', required: true, placeholder: 'Ej: Administración' },
        {
          name: 'piso',
          label: 'Piso',
          type: 'select',
          required: true,
          options: opcionesPisos,
          placeholder: 'Seleccione el piso'
        }
      ],
      initialState: ubicacion ? { ...ubicacion } : {},
      submitLabel: ubicacion ? 'Actualizar' : 'Guardar',
    },
    onClose: async (event) => {
      const data = event.data
      if (data) {
        // Validar duplicados por nombre
        const existe = ubicacionesStore.ubicaciones.some(
          u => u.nombre.toUpperCase() === data.nombre.toUpperCase() && (!ubicacion || u.id !== ubicacion.id)
        )
        if (existe) {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Ya existe una ubicación con ese nombre.', life: 3000 })
          return
        }

        try {
          if (ubicacion) {
            await ubicacionesStore.editUbicacion(ubicacion.id, data)
            toast.add({ severity: 'success', summary: 'Actualizada', detail: 'Ubicación actualizada.', life: 3000 })
          } else {
            await ubicacionesStore.addUbicacion(data)
            toast.add({ severity: 'success', summary: 'Creada', detail: 'Ubicación registrada.', life: 3000 })
          }
        } catch (error) {
          toast.add({
            severity: 'error',
            summary: 'Ocurrió un error al eliminar',
            detail: getErrorMessage(error), // <--- Usamos el traductor
            life: 4000
          })
        }
      }
    }
  })
}

const confirmarEliminar = (ubicacion) => {
  confirm.require({
    header: 'Confirmar Eliminación',
    message: `¿Eliminar la ubicación "${ubicacion.nombre}"?`,
    icon: 'pi pi-exclamation-triangle',
    severity: 'danger',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await ubicacionesStore.removeUbicacion(ubicacion.id)
        toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Ubicación borrada.', life: 3000 })
      } catch (error) {
        console.error('Error al eliminar:', error)
        toast.add({
          severity: 'error',
          summary: 'Ocurrió un error al eliminar',
          detail: getErrorMessage(error), // <--- Usamos el traductor
          life: 4000
        })
      }
    }
  })
}

const actionsMenuModel = ref([
  { label: 'Editar', icon: 'pi pi-pencil', command: () => abrirModalUbicacion(currentItem.value) },
  { label: 'Eliminar', icon: 'pi pi-trash', command: () => confirmarEliminar(currentItem.value) }
])

const toggleActionsMenu = (event, data) => {
  currentItem.value = data
  menuRef.value.toggle(event)
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-1 border border-gray-200">
    <DataTable :value="ubicacionesStore.ubicaciones" :loading="ubicacionesStore.isLoading" paginator :rows="10"
      stripedRows responsiveLayout="stack" breakpoint="768px" class="p-datatable-sm p-4 text-xs">

      <template #header>
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 p-2">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Ubicaciones / Departamentos</h1>
            <p class="text-slate-500 text-sm">Gestión de áreas y departamentos del hotel.</p>
          </div>
          <Button label="Nueva" icon="pi pi-plus" class="!text-sm" raised rounded variant="outlined"
            @click="abrirModalUbicacion()" />
        </div>
      </template>

      <template #empty> No se encontraron ubicaciones registradas. </template>
      <template #loading>
        <div class="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-lg">
          <div class="relative w-12 h-12 mb-4">
            <div class="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-sky-600 rounded-full border-t-transparent animate-spin">
            </div>
          </div>
          <span class="text-sm font-bold text-slate-500 tracking-widest uppercase">Cargando Ubicaciones...</span>
        </div>
      </template>

      <!-- Columna Principal (Estilo Esmeralda) -->
<Column field="nombre" header="Nombre" sortable style="width: 45%"></Column>
  <Column field="piso" header="Piso" sortable style="width: 45%"></Column> <Column header="Acciones" style="width: 10%">...</Column>

      <Column header="Acciones" :exportable="false" class="text-center" style="width: 10%">
        <template #body="slotProps">
          <Button icon="pi pi-ellipsis-v" class="p-button-text p-button-rounded text-emerald-500 hover:bg-emerald-50"
            @click="toggleActionsMenu($event, slotProps.data)" />
        </template>
      </Column>
    </DataTable>
    <Menu ref="menuRef" :model="actionsMenuModel" :popup="true" />
  </div>
</template>
