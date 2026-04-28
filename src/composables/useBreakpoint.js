// src/composables/useBreakpoint.js
import { ref, onMounted, onUnmounted, readonly } from 'vue'

// Usamos 768px (el breakpoint 'md' de Tailwind) como nuestro límite
const BREAKPOINT = 768

export function useBreakpoint() {
  const isMobile = ref(window.innerWidth < BREAKPOINT)

  const update = () => {
    isMobile.value = window.innerWidth < BREAKPOINT
  }

  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  return { isMobile: readonly(isMobile) } // Exponemos como solo-lectura
}
