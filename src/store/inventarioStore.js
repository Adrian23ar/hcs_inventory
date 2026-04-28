// src/store/inventarioStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} from '@/services/inventarioService'

export const useInventarioStore = defineStore('inventario', () => {
  // --- STATE ---
  const equipos = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // --- ACTIONS ---

  /**
   * Carga todos los equipos desde Firestore
   */
  const fetchEquipos = async () => {
    isLoading.value = true
    error.value = null
    try {
      equipos.value = await getEquipos()
    } catch (err) {
      console.error(err)
      error.value = 'No se pudieron cargar los equipos.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Llama al servicio para crear un equipo y actualiza el estado local
   */
  const addEquipo = async (equipoData) => {
    isLoading.value = true
    error.value = null
    try {
      // Usamos los datos devueltos (con ID y timestamp)
      const nuevoEquipo = await createEquipo(equipoData)
      equipos.value.push(nuevoEquipo)
      return nuevoEquipo
    } catch (err) {
      console.error(err)
      error.value = 'No se pudo crear el equipo.'
      throw err // Lanzamos el error para que el modal lo sepa
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Llama al servicio para actualizar un equipo y actualiza el estado local
   */
  const editEquipo = async (id, equipoData) => {
    isLoading.value = true
    error.value = null
    try {
      const equipoActualizado = await updateEquipo(id, equipoData)
      // Reemplazamos el ítem en el array local
      const index = equipos.value.findIndex((e) => e.id === id)
      if (index !== -1) {
        equipos.value[index] = equipoActualizado
      }
      return equipoActualizado
    } catch (err) {
      console.error(err)
      error.value = 'No se pudo actualizar el equipo.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Llama al servicio para eliminar un equipo y actualiza el estado local
   */
  const removeEquipo = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      await deleteEquipo(id)
      // Eliminamos el ítem del array local
      equipos.value = equipos.value.filter((e) => e.id !== id)
    } catch (err) {
      console.error(err)
      error.value = 'No se pudo eliminar el equipo.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    equipos,
    isLoading,
    error,
    fetchEquipos,
    addEquipo,
    editEquipo,
    removeEquipo,
  }
})
