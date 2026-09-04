import { createApp } from 'vue'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import '@/assets/styles/main.css'

import App from '@/App.vue'
import router from '@/router'
import pinia from '@/pinia.js'
import i18n from '@/i18n.js'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark',
            cssLayer: {
                name: 'primevue',
                order: 'primevue'
            }
        }
    }
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

app.mount('#app')
