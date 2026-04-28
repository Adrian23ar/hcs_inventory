<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/store/authStore'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')

// Limpiamos el error al montar el componente
authStore.authError = null

const handleLogin = async () => {
  await authStore.login(email.value, password.value)
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 px-4">
    <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md border border-gray-200">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900">
          Hotel Chacao Suites
        </h2>
        <p class="mt-2 text-gray-600">
          Inicio de Sesión del Inventario
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <InputText id="email" v-model="email" type="email" placeholder="ventas@hotelchacaosuites.com" required
            class="w-full mt-1" :invalid="!!authStore.authError" />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
          <Password id="password" v-model="password" placeholder="Tu contraseña" required toggleMask :feedback="false"
            class="w-full mt-1" inputClass="w-full" :invalid="!!authStore.authError" />
        </div>

        <Message v-if="authStore.authError" severity="error" :closable="false">
          {{ authStore.authError }}
        </Message>

        <div>
          <Button type="submit" label="Iniciar Sesión" icon="pi pi-sign-in" class="w-full"
            :loading="authStore.isLoading" />
        </div>

        <div class="text-sm text-center">
          <RouterLink to="/reset-password" class="font-medium text-green-600 hover:text-green-500">
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>



<style>
/* Hacemos que el input dentro de <Password> ocupe el 100% */
.p-password input {
  width: 100%;
}
</style>
