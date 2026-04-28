// src/services/ubicacionesService.js
import { db } from './firebase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'

const ubicacionesCollection = collection(db, 'ubicaciones')

export const getUbicaciones = async () => {
  // Ordenamos alfabéticamente por defecto
  const q = query(ubicacionesCollection, orderBy('nombre', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const createUbicacion = async (data) => {
  const docRef = await addDoc(ubicacionesCollection, data)
  return { id: docRef.id, ...data }
}

export const updateUbicacion = async (id, data) => {
  const docRef = doc(db, 'ubicaciones', id)
  await updateDoc(docRef, data)
  return { id, ...data }
}

export const deleteUbicacion = async (id) => {
  const docRef = doc(db, 'ubicaciones', id)
  await deleteDoc(docRef)
}
