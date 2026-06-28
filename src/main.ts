import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import './assets/css/main.css'

import App from './App.vue'
import router from './router'
import { useDiscreteApi } from './composable/use_naiveui_discrete_api.ts'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

useDiscreteApi()

app.use(pinia)
app.use(router)

app.mount('#app')
