/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */


import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from '@/router'
import { registerUnauthorizedHandler } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { registerPlugins } from '@/plugins'

// Styles
import 'unfonts.css'



const app = createApp(App)
registerPlugins(app)

const pinia = createPinia()
app.use(pinia)
app.use(router)

const authStore = useAuthStore()
registerUnauthorizedHandler(() => {
    authStore.user = null
    //router.push('/login')
})

authStore.checkAuth().finally(() => {
    app.mount('#app')
})