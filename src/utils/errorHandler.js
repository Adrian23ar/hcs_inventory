// src/utils/errorHandler.js

export const getErrorMessage = (error) => {
  // Si no hay error definido, devolvemos un mensaje genérico
  if (!error) return 'Ocurrió un error desconocido.';

  // Verificamos si es un error de Firebase (suelen tener una propiedad 'code')
  if (error.code) {
    switch (error.code) {
      // Errores de Base de Datos (Firestore)
      case 'permission-denied':
        return 'No tienes los permisos necesarios para realizar esta acción.';
      case 'unavailable':
        return 'Sin conexión al servidor. Revisa tu internet.';
      case 'not-found':
        return 'El registro que buscas no existe o fue eliminado.';

      // Errores de Autenticación (Si usas el authStore)
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Correo o contraseña incorrectos.';
      case 'auth/network-request-failed':
        return 'Fallo en la red. Comprueba tu conexión a internet.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde.';

      default:
        // Si hay un código que no mapeamos, lo mostramos para debug
        console.warn('Error no mapeado:', error.code);
        return 'Ocurrió un error en el servidor. Intenta de nuevo.';
    }
  }

  // Si es un error estándar de JavaScript (ej. un TypeError)
  if (error.message) {
    // Aquí puedes decidir si quieres mostrar el message original o uno tuyo
    return 'Ocurrió un error inesperado al procesar los datos.';
  }

  return 'Ocurrió un error inesperado.';
}
