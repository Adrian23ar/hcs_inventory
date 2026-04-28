// src/store/ubicacionesStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUbicaciones, createUbicacion, updateUbicacion, deleteUbicacion } from '@/services/ubicacionesService'

export const useUbicacionesStore = defineStore('ubicaciones', () => {
  const ubicaciones = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchUbicaciones = async () => {
    isLoading.value = true
    try {
      ubicaciones.value = await getUbicaciones()
    } catch (err) {
      console.error(err)
      error.value = 'No se pudieron cargar las ubicaciones.'
    } finally {
      isLoading.value = false
    }
  }

  const addUbicacion = async (data) => {
    isLoading.value = true
    try {
      const nueva = await createUbicacion(data)
      ubicaciones.value.push(nueva)
      ubicaciones.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
      return nueva
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const editUbicacion = async (id, data) => {
    isLoading.value = true
    try {
      const actualizada = await updateUbicacion(id, data)
      const index = ubicaciones.value.findIndex(u => u.id === id)
      if (index !== -1) ubicaciones.value[index] = actualizada
      ubicaciones.value.sort((a, b) => a.nombre.localeCompare(b.nombre))
      return actualizada
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const removeUbicacion = async (id) => {
    isLoading.value = true
    try {
      await deleteUbicacion(id)
      ubicaciones.value = ubicaciones.value.filter(u => u.id !== id)
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return { ubicaciones, isLoading, error, fetchUbicaciones, addUbicacion, editUbicacion, removeUbicacion }
})
