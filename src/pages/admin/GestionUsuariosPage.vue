<script setup>
import { onMounted } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag' // <-- Usaremos Tag para el Rol
import { useDialog } from 'primevue/usedialog'
import { useToast } from 'primevue/usetoast'
import { useGestionUsuariosStore } from '@/store/gestionUsuariosStore'
import GenericFormPrompt from '@/components/GenericFormPrompt.vue'

const dialog = useDialog()
const toast = useToast()
const usuariosStore = useGestionUsuariosStore()

// Cargamos los usuarios al montar
onMounted(() => {
  usuariosStore.fetchUsuarios()
})

// Función para abrir el modal de edición
const abrirModalEditarRol = (usuario) => {
  const camposDelFormulario = [
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      disabled: true, // No dejamos que editen el email
    },
    {
      name: 'nombre',
      label: 'Nombre (Opcional)',
      type: 'text',
    },
    {
      name: 'rol',
      label: 'Rol del Usuario',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Supervisor', value: 'supervisor' },
        { label: 'Usuario', value: 'usuario' },
      ],
    },
  ]

  dialog.open(GenericFormPrompt, {
    props: {
      header: `Editar Usuario: ${usuario.email}`,
      modal: true,
      style: { width: '90vw', 'max-width': '700px' },
    },
    data: {
      fields: camposDelFormulario,
      initialState: { ...usuario }, // Pasamos los datos actuales
      submitLabel: 'Actualizar Rol',
    },
    onClose: async (event) => {
      const data = event.data
      if (data) {
        try {
          await usuariosStore.editUsuario(usuario.id, data)
          toast.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Rol de usuario actualizado.',
            life: 3000,
          })
        } catch (error) {
          console.error(error)
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el rol.',
            life: 3000,
          })
        }
      }
    },
  })
}

// Helper para dar color a los roles
const getSeverityForRole = (rol) => {
  switch (rol) {
    case 'admin': return 'danger'
    case 'supervisor': return 'warning'
    case 'usuario': return 'info'
    default: return 'secondary'
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <DataTable :value="usuariosStore.usuarios" :loading="usuariosStore.isLoading" paginator :rows="10" removableSort
      stripedRows responsiveLayout="stack" breakpoint="768px" tableStyle="min-width: 50rem"
      class="p-datatable-sm p-4 text-xs">

      <template #header>
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 p-2">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
            <p class="text-slate-500 text-sm">Asignar roles al personal del hotel.</p>
          </div>
        </div>
      </template>

      <template #empty> No se encontraron usuarios. </template>
      <template #loading>
        <div class="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-lg">
          <div class="relative w-12 h-12 mb-4">
            <div class="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-sky-600 rounded-full border-t-transparent animate-spin">
            </div>
          </div>
          <span class="text-sm font-bold text-slate-500 tracking-widest uppercase">Cargando Usuarios...</span>
        </div>
      </template>
      <!-- Columna Principal (Estilo Esmeralda) -->
      <Column field="email" sortable headerClass="bg-emerald-50/50"
        bodyClass="bg-emerald-50/30 font-medium text-emerald-800">
        <template #header>
          <span class="text-emerald-700">Email <span class="text-[10px] ml-1">↑↓</span></span>
        </template>
      </Column>

      <Column field="nombre" sortable>
        <template #header>
          <span class="text-slate-700">Nombre <span class="text-slate-400 text-[10px] ml-1">↑↓</span></span>
        </template>
      </Column>

      <Column field="rol" sortable>
        <template #header>
          <span class="text-slate-700">Rol <span class="text-slate-400 text-[10px] ml-1">↑↓</span></span>
        </template>
        <template #body="slotProps">
          <Tag :value="slotProps.data.rol" :severity="getSeverityForRole(slotProps.data.rol)" rounded
            class="text-[10px]" />
        </template>
      </Column>

      <Column header="Acciones" :exportable="false" class="text-center">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" class="p-button-text p-button-rounded text-emerald-500 hover:bg-emerald-50"
            @click="abrirModalEditarRol(slotProps.data)" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
