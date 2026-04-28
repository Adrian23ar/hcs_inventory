// src/services/gestionUsuariosService.js
import { db } from '@/services/firebase'
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore'

const usuariosCollection = collection(db, 'usuarios')

/**
 * Obtiene todos los usuarios de la colección 'usuarios'.
 */
export const getUsuarios = async () => {
  const querySnapshot = await getDocs(usuariosCollection)
  const usuarios = []
  querySnapshot.forEach((doc) => {
    // Importante: El ID del documento es el UID del usuario
    usuarios.push({ id: doc.id, ...doc.data() })
  })
  return usuarios
}

/**
 * Actualiza un documento de usuario en Firestore.
 * @param {string} uid - El ID del documento (UID del usuario)
 * @param {object} dataToUpdate - Objeto con los campos a cambiar (ej: { rol: 'supervisor' })
 */
export const updateUsuario = async (uid, dataToUpdate) => {
  const docRef = doc(db, 'usuarios', uid)
  await updateDoc(docRef, dataToUpdate)
  return { id: uid, ...dataToUpdate }
}
