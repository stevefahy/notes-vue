import { Buffer } from 'buffer'
;(globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer

import { createApp, defineAsyncComponent } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const LoadingScreen = defineAsyncComponent(() => import('./components/UI/LoadingScreen.vue'))
const ErrorAlert = defineAsyncComponent(() => import('./components/UI/ErrorAlert.vue'))

// Vuetify
import 'vuetify/styles'
import './assets/styles/main.css'
import { createVuetify } from 'vuetify'
import type { ThemeDefinition } from 'vuetify'
import { md, aliases } from 'vuetify/iconsets/md'

const myCustomLightTheme: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#1b3d29',
    'primary-darken-1': '#2e7d52',
    secondary: '#2e7d52',
    'secondary-darken-1': '#1b3d29',
    error: '#B91C1C',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00'
  }
}

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'myCustomLightTheme',
    themes: {
      myCustomLightTheme
    }
  },
  icons: {
    defaultSet: 'md',
    aliases,
    sets: {
      md
    }
  }
})

const app = createApp(App)
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.component('ErrorAlert', ErrorAlert).component('LoadingScreen', LoadingScreen)
app.mount('#app')
