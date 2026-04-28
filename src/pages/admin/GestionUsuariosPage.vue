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
      stripedRows responsiveLayout="stack" breakpoint="768px" tableStyle="min-width: 50rem">
      <template #header>
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
            <p class="text-gray-500">
              Asignar roles al personal del hotel
            </p>
          </div>
        </div>
      </template>

      <template #empty> No se encontraron usuarios. </template>
      <template #loading> Cargando datos de usuarios... </template>

      <Column field="email" header="Email" sortable></Column>
      <Column field="nombre" header="Nombre" sortable></Column>

      <Column field="rol" header="Rol" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.rol" :severity="getSeverityForRole(slotProps.data.rol)" rounded />
        </template>
      </Column>

      <Column header="Acciones" :exportable="false" style="width: 10%">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" text rounded @click="abrirModalEditarRol(slotProps.data)" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
