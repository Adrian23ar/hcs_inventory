<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Resetear Contraseña
        </h2>
        <p class="mt-2 text-gray-600">
          Ingresa tu correo y te enviaremos un enlace para resetear tu clave.
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="handleReset">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <InputText id="email" v-model="email" type="email" placeholder="Tu correo registrado" required
            class="w-full mt-1" :invalid="!!authStore.authError" />
        </div>

        <Message v-if="authStore.authError" severity="error" :closable="false">
          {{ authStore.authError }}
        </Message>

        <div>
          <Button type="submit" label="Enviar Correo" icon="pi pi-send" class="w-full" :loading="authStore.isLoading" />
        </div>

        <div class="text-sm text-center">
          <RouterLink to="/login" class="font-medium text-green-600 hover:text-green-500">
            Volver a Iniciar Sesión
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
import { useToast } from 'primevue/usetoast' // <-- Para notificaciones
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

const authStore = useAuthStore()
const toast = useToast() // <-- Inicializamos el servicio de Toast

const email = ref('')

// Limpiamos el error al montar el componente
authStore.authError = null

const handleReset = async () => {
  try {
    await authStore.resetPassword(email.value)

    // Si tiene éxito, mostramos una notificación
    toast.add({
      severity: 'success',
      summary: 'Correo Enviado',
      detail: 'Revisa tu bandeja de entrada para el enlace de reseteo.',
      life: 5000,
    })

  } catch (error) {
    // El error ya se maneja en el store y se muestra en el <Message>
    // Opcionalmente, podríamos mostrarlo en un toast también:
    // toast.add({
    //   severity: 'error',
    //   summary: 'Error',
    //   detail: authStore.authError,
    //   life: 3000,
    // })
  }
}
</script>
