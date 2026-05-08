// src/main.js
import './main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura';
import DialogService from 'primevue/dialogservice'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'


const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, { ripple: true,
  theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: 'none',
            cssLayer: false
        }
    }
 })
app.use(DialogService)
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
