// src/store/inventarioStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getEquipos,
  createEquipo,
  updateEquipo,
} from '@/services/inventarioService'

export const useInventarioStore = defineStore('inventario', () => {
  // --- STATE ---
  const equipos = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // --- ACTIONS ---

  /**
     * Carga todos los equipos desde Firestore y filtra los inactivos
     */
  const fetchEquipos = async () => {
    isLoading.value = true
    error.value = null
    try {
      const data = await getEquipos()
      // Filtramos para mantener solo los activos (o los que no tengan el campo estado definido aún)
      equipos.value = data.filter((e) => e.estado !== 'Inactivo')
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
      await updateEquipo(id, equipoData) // Esperamos a que Firebase guarde

      const index = equipos.value.findIndex((e) => e.id === id)
      if (index !== -1) {
        // IMPORTANTE: Combinamos los datos anteriores con los nuevos
        // usando el operador spread (...) para no perder los campos viejos
        equipos.value[index] = {
          ...equipos.value[index],
          ...equipoData
        }
      }
      return equipos.value[index]
    } catch (err) {
      console.error(err)
      error.value = 'No se pudo actualizar el equipo.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
     * Llama al servicio para hacer un "Soft Delete" (Eliminación Lógica)
     */
  const removeEquipo = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      // En lugar de usar deleteEquipo(id), actualizamos el estado
      await updateEquipo(id, { estado: 'Inactivo' })
      // Eliminamos el ítem del array local para que desaparezca de la tabla
      equipos.value = equipos.value.filter((e) => e.id !== id)
    } catch (err) {
      console.error(err)
      error.value = 'No se pudo dar de baja el equipo.'
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
