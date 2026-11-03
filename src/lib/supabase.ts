import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const apiKey = publishableKey || legacyAnonKey

export const isSupabaseConfigured = Boolean(url && apiKey)

let clientPromise: Promise<SupabaseClient | null> | null = null

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url!, apiKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }))
  }
  return clientPromise
}
