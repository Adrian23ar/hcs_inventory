// src/services/inventarioService.js
import { db } from '@/services/firebase'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'

// Referencia a nuestra colección 'inventario' en Firestore
const inventarioCollection = collection(db, 'inventario')

/**
 * Obtiene todos los equipos del inventario.
 */
export const getEquipos = async () => {
  const querySnapshot = await getDocs(inventarioCollection)
  const equipos = []
  querySnapshot.forEach((doc) => {
    equipos.push({ id: doc.id, ...doc.data() })
  })
  return equipos
}

/**
 * Crea un nuevo equipo en el inventario.
 */
export const createEquipo = async (equipoData) => {
  const dataConTimestamp = {
    ...equipoData,
    fecha_creacion: serverTimestamp(), // Añade la fecha de creación
  }
  const docRef = await addDoc(inventarioCollection, dataConTimestamp)
  return { id: docRef.id, ...dataConTimestamp }
}

/**
 * Actualiza un equipo existente.
 */
export const updateEquipo = async (id, equipoData) => {
  const docRef = doc(db, 'inventario', id)
  await updateDoc(docRef, equipoData)
  return { id, ...equipoData }
}
