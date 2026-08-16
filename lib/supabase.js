import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzatwqavzwpufgsododd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RjTlQbCkXMwirgaCyjcPPg_0s8cSqVU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

