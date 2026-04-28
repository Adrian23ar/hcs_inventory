<script setup>
import { inject, reactive, computed } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select' // (Cambiado de Dropdown a Select)
import Textarea from 'primevue/textarea'

const dialogRef = inject('dialogRef')
const { fields, initialState, submitLabel } = dialogRef.value.data

// 3. Creamos el estado reactivo
const formData = reactive(
  initialState && Object.keys(initialState).length > 0
    ? {
      ...initialState,
      // Aseguramos que 'especificaciones' sea un objeto si existe
      especificaciones: initialState.especificaciones || {}
    }
    : fields.reduce((acc, field) => {
      // Inicializamos el objeto 'especificaciones' vacío
      acc.especificaciones = {}
      acc[field.name] = field.defaultValue ?? null
      return acc
    }, {})
)

const labelBotonGuardar = computed(() => submitLabel || 'Guardar')

/**
 * ¡NUEVA LÓGICA DE VISIBILIDAD!
 * Comprueba si un campo debe mostrarse basado en la selección de 'tipo_equipo'.
 */
const shouldShowField = (field) => {
  // Si el campo no tiene 'showIf', siempre se muestra (ej. 'marca', 'lugar')
  if (!field.showIf) {
    return true
  }
  // Si tiene 'showIf', solo se muestra si coincide con 'tipo_equipo'
  return field.showIf === formData.tipo_equipo
}

/**
 * ¡NUEVA LÓGICA DE LIMPIEZA!
 * Antes de guardar, eliminamos los campos de especificaciones
 * que no pertenecen al tipo de equipo seleccionado.
 */
const getCleanedData = () => {
  const cleanData = { ...formData }
  const currentSpecKeys = fields
    .filter(f => f.isNested && f.showIf === formData.tipo_equipo)
    .map(f => f.name)

  const allSpecKeys = fields
    .filter(f => f.isNested)
    .map(f => f.name)

  // Nos aseguramos de que el objeto de especificaciones exista
  if (!cleanData.especificaciones) {
    cleanData.especificaciones = {}
  }

  // Borramos las claves que NO pertenecen al tipo seleccionado
  for (const key of allSpecKeys) {
    if (!currentSpecKeys.includes(key)) {
      delete cleanData.especificaciones[key]
    }
  }

  // Si no hay especificaciones (ej. tipo 'Otro'), borramos el objeto
  if (Object.keys(cleanData.especificaciones).length === 0) {
    delete cleanData.especificaciones
  }

  return cleanData
}


const guardar = () => {
  const cleanData = getCleanedData()
  dialogRef.value.close(cleanData) // Devolvemos los datos limpios
}

const cancelar = () => {
  dialogRef.value.close(null)
}

// --- ¡NUEVA FUNCIÓN! ---
// Esta función decide dónde escribir el nuevo valor
const updateValue = (field, newValue) => {
  if (field.isNested) {
    formData.especificaciones[field.name] = newValue
  } else {
    formData[field.name] = newValue
  }
}
</script>

<template>
  <form @submit.prevent="guardar">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4">

      <template v-for="field in fields" :key="field.name">
        <div v-if="shouldShowField(field)" class="flex flex-col gap-2">

          <label :for="field.name" class="font-medium text-sm">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </label>

          <InputText v-if="field.type === 'text' || field.type === 'email'" :id="field.name"
            :model-value="field.isNested ? formData.especificaciones[field.name] : formData[field.name]"
            @update:model-value="updateValue(field, $event)" :type="field.type"
            :placeholder="field.placeholder || field.label" :required="field.required" :disabled="field.disabled"
            class="w-full" />

          <InputNumber v-else-if="field.type === 'number'" :id="field.name"
            :model-value="field.isNested ? formData.especificaciones[field.name] : formData[field.name]"
            @update:model-value="updateValue(field, $event)" :placeholder="field.placeholder || field.label"
            :required="field.required" :disabled="field.disabled" :min="field.min" :max="field.max" class="w-full"
            inputClass="w-full" />

          <Select v-else-if="field.type === 'select'" :id="field.name"
            :model-value="field.isNested ? formData.especificaciones[field.name] : formData[field.name]"
            @update:model-value="updateValue(field, $event)" :options="field.options" optionLabel="label"
            optionValue="value" :placeholder="field.placeholder || `Seleccionar un ${field.label}`"
            :required="field.required" :disabled="field.disabled" class="w-full" />

          <Textarea v-else-if="field.type === 'textarea'" :id="field.name"
            :model-value="field.isNested ? formData.especificaciones[field.name] : formData[field.name]"
            @update:model-value="updateValue(field, $event)" :placeholder="field.placeholder || field.label"
            :required="field.required" :disabled="field.disabled" rows="3" class="w-full" autoResize />

        </div>
      </template>
    </div>

    <div class="flex justify-end gap-2 p-4 border-t border-gray-200">
      <Button label="Cancelar" severity="secondary" @click="cancelar" type="button" />
      <Button :label="labelBotonGuardar" type="submit" />
    </div>
  </form>
</template>

<style>
/* (Estilos sin cambios) */
.p-inputnumber.w-full {
  width: 100%;
}

.p-inputnumber.w-full .p-inputnumber-input {
  width: 100%;
}
</style>
