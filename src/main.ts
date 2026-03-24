import App from '@/App.vue'
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@/styles/calendar-tokens.css'
import './styles/main.scss'

// Early preconnect to Supabase for faster API calls
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
if (supabaseUrl && !document.querySelector(`link[rel="preconnect"][href="${supabaseUrl}"]`)) {
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = supabaseUrl
  document.head.append(link)
}

const app = createApp(App)
app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')
