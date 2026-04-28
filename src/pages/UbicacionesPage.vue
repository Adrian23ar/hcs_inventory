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
  dialog.open(GenericFormPrompt, {
    props: {
      header: ubicacion ? `Editar Ubicación` : 'Nueva Ubicación',
      modal: true,
      style: { width: '90vw', 'max-width': '600px' }
    },
    data: {
      fields: [
        { name: 'nombre', label: 'Nombre de la Ubicación', type: 'text', required: true, placeholder: 'Ej: Administración' },
        { name: 'descripcion', label: 'Descripción (Opcional)', type: 'text', placeholder: 'Ej: Edificio principal, piso 1' }
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
          toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al guardar.', life: 3000 })
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
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.', life: 3000 })
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
      stripedRows responsiveLayout="stack">
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold text-gray-800">Ubicaciones / Departamentos</h1>
          <Button label="Nueva Ubicación" icon="pi pi-plus" @click="abrirModalUbicacion()" />
        </div>
      </template>

      <template #empty> No se encontraron ubicaciones registradas. </template>

      <Column field="nombre" header="Nombre" sortable style="width: 45%"></Column>
      <Column field="descripcion" header="Descripción" style="width: 45%"></Column>
      <Column header="Acciones" style="width: 10%">
        <template #body="slotProps">
          <Button icon="pi pi-ellipsis-v" text rounded @click="toggleActionsMenu($event, slotProps.data)" />
        </template>
      </Column>
    </DataTable>
    <Menu ref="menuRef" :model="actionsMenuModel" :popup="true" />
  </div>
</template>
