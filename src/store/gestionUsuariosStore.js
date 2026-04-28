// src/store/gestionUsuariosStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUsuarios, updateUsuario } from '@/services/gestionUsuariosService'

export const useGestionUsuariosStore = defineStore('gestionUsuarios', () => {
  // --- STATE ---
  const usuarios = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // --- ACTIONS ---

  /**
   * Carga todos los usuarios desde Firestore
   */
  const fetchUsuarios = async () => {
    isLoading.value = true
    error.value = null
    try {
      usuarios.value = await getUsuarios()
    } catch (err) {
      console.error(err)
      error.value = 'No se pudieron cargar los usuarios.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Llama al servicio para actualizar un usuario y actualiza el estado local
   */
  const editUsuario = async (uid, data) => {
    isLoading.value = true
    error.value = null
    try {
      // Solo pasamos los campos que queremos actualizar
      const dataToUpdate = {
        nombre: data.nombre,
        rol: data.rol,
      }
      await updateUsuario(uid, dataToUpdate)

      // Actualizamos el estado local para reactividad
      const index = usuarios.value.findIndex((u) => u.id === uid)
      if (index !== -1) {
        // Actualizamos los campos en el objeto local
        usuarios.value[index] = { ...usuarios.value[index], ...dataToUpdate }
      }
    } catch (err) {
      console.error(err)
      error.value = 'No se pudo actualizar el usuario.'
      throw err // Lanzamos el error para el modal
    } finally {
      isLoading.value = false
    }
  }

  return {
    usuarios,
    isLoading,
    error,
    fetchUsuarios,
    editUsuario,
  }
})
