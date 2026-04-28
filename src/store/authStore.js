// src/store/authStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/services/firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export const useAuthStore = defineStore('auth', () => {

  // === STATE (Equivalente a tu useState) ===
  const router = useRouter()
  const user = ref(null) // Contendrá el objeto de Firebase Auth (uid, email, etc.)
  const userDetails = ref(null) // Contendrá nuestros datos de Firestore (rol, nombre, etc.)
  const isLoading = ref(false) // Para pantallas de carga
  const authError = ref(null) // Para mensajes de error en el login
  const isInitialized = ref(false) // <-- AÑADIR ESTA LÍNEA
  // === GETTERS (Equivalente a valores computados) ===
  const isLoggedIn = computed(() => !!user.value)
  const userRole = computed(() => userDetails.value?.rol || null)

  // === ACTIONS (Equivalente a tus funciones login/logout) ===

  /**
   * Inicia sesión y luego busca los detalles (rol) del usuario en Firestore.
   */
  const login = async (email, password) => {
    isLoading.value = true
    authError.value = null
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      // 1. Tenemos el usuario de Auth
      user.value = userCredential.user

      // 2. Buscamos sus detalles (rol) en Firestore
      await fetchUserDetails(userCredential.user.uid)

      // 3. Redirigimos al dashboard
      router.push('/') // O a '/dashboard'

    } catch (error) {
      console.error(error)
      // Traducimos el error de Firebase a algo amigable
      if (error.code === 'auth/invalid-credential') {
        authError.value = 'Credenciales inválidas. Intente de nuevo'
      } else {
        authError.value = 'Ocurrió un error inesperado. Intente de nuevo.'
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await signOut(auth)
      user.value = null
      userDetails.value = null
      router.push('/login')
    } catch (error) {
      console.error(error)
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (email) => {
    isLoading.value = true
    authError.value = null
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error(error)
      if (error.code === 'auth/user-not-found') {
        authError.value = 'No existe un usuario registrado con ese correo.'
      } else {
        authError.value = 'Ocurrió un error al enviar el correo.'
      }
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserDetails = async (uid) => {
    if (!uid) return

    const userDocRef = doc(db, 'usuarios', uid)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      userDetails.value = userDocSnap.data()
    } else {
      console.warn("Usuario autenticado pero sin detalles/rol en Firestore.")
      userDetails.value = null // O un objeto con rol 'invitado'
      // await logout()
    }
  }

  /**
   * Listener que se ejecuta al cargar la app.
   * Mantiene la sesión activa si el usuario recarga la página.
   */
  const init = () => {
    // Si ya se inicializó, no lo hagas de nuevo
    if (isInitialized.value) return Promise.resolve(user.value);

    isLoading.value = true;
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          user.value = firebaseUser
          await fetchUserDetails(firebaseUser.uid)
        } else {
          user.value = null
          userDetails.value = null
        }
        isLoading.value = false
        isInitialized.value = true
        resolve(user.value)
      })
    })
  }

  // Exponemos el estado y las funciones
  return {
    user,
    userDetails,
    isLoading,
    authError,
    isLoggedIn,
    userRole,
    login,
    logout,
    resetPassword,
    init,
    isInitialized
  }
})
