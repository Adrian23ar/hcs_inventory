<script setup>
import { RouterView } from 'vue-router'
import DynamicDialog from 'primevue/dynamicdialog' // <-- El 'portal'
import Toast from 'primevue/toast'                 // <-- El 'portal' de notificaciones
import ConfirmDialog from 'primevue/confirmdialog';
</script>

<template>
  <RouterView />

  <DynamicDialog />

  <Toast />
  <ConfirmDialog />
</template>
