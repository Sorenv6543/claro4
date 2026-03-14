// src/plugins/supabase.ts - Production Configuration
import { createClient } from '@supabase/supabase-js'

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  if (!import.meta.env.DEV) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file:\n'
      + '- VITE_SUPABASE_URL\n'
      + '- VITE_SUPABASE_ANON_KEY',
    )
  }
  console.warn('⚠️ Missing Supabase env vars — running without backend. Components that call Supabase will fail gracefully.')
}

console.log('🔗 Connecting to Supabase:', supabaseUrl)

// Create Supabase client with production settings
export const supabase = createClient(supabaseUrl ?? 'https://placeholder.supabase.co', supabaseAnonKey ?? 'placeholder', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // More secure flow
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit for production performance
    },
  },
  db: {
    schema: 'public',
  },
})

// Debug connection (only in development)
if (import.meta.env.VITE_DEBUG_AUTH === 'true') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state change:', event, session?.user?.id)
  })
}

// Safe connection test - check auth service instead of protected tables
supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection failed:', error)
    } else {
      console.log('✅ Supabase connected successfully. Auth service operational.')
      if (data.session) {
        console.log('🔐 Existing session found for user:', data.session.user.id)
      }
    }
  })
  .catch(error => {
    console.error('❌ Supabase connection failed:', error)
  })

export default supabase
