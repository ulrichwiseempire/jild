import { createClient } from '@supabase/supabase-js'

// Ces variables viennent de ton fichier .env.local sur Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL ou Anon Key manquante dans les variables d'environnement .env.local")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

