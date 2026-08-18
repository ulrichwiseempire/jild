import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─────────────────────────────────────────────────────────────
// ICÔNES SVG (Style Instagram / Vectorielles)
// ─────────────────────────────────────────────────────────────
const ChevronRight = () => (
  <svg className="w-4 h-4 stroke-slate-500 fill-none" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

const BookmarkIcon = () => (
  <svg className="w-5 h-5 stroke-slate-200 fill-none" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-5 h-5 stroke-slate-200 fill-none" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5 stroke-slate-200 fill-none" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
)

const UserBlockIcon = () => (
  <svg className="w-5 h-5 stroke-slate-200 fill-none" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
)

const HelpIcon = () => (
  <svg className="w-5 h-5 stroke-slate-200 fill-none" viewBox="0 0 24 24" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function Parametres() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex justify-center font-sans pb-12">
      <div className="w-full max-w-md border-x border-slate-800/60 min-h-screen flex flex-col">

        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-[#090d16]/95 backdrop-blur-md px-4 py-3.5 flex items-center gap-4 border-b border-slate-800/60">
          <Link href="/mon-profil" className="text-slate-200 hover:text-white">
            <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="font-bold text-base text-white">Paramètres et activité</h1>
        </header>

        {/* BARRE DE RECHERCHE */}
        <div className="p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 stroke-slate-500 fill-none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input 
              type="text" 
              placeholder="Rechercher" 
              className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
            />
          </div>
        </div>

        {/* SECTIONS */}
        <div className="divide-y divide-slate-800/40 text-xs">
          
          {/* SECTION : UTILISATION PERSONNELLE */}
          <div className="py-2">
            <p className="px-4 py-2 font-bold text-slate-500 text-[11px]">Utilisation personnelle</p>
            
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/50 transition">
              <div className="flex items-center gap-3">
                <BookmarkIcon />
                <span className="text-slate-200 font-medium">Enregistré</span>
              </div>
              <ChevronRight />
            </button>

            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/50 transition">
              <div className="flex items-center gap-3">
                <BellIcon />
                <span className="text-slate-200 font-medium">Notifications</span>
              </div>
              <ChevronRight />
            </button>
          </div>

          {/* SECTION : QUI PEUT VOIR VOTRE CONTENU */}
          <div className="py-2">
            <p className="px-4 py-2 font-bold text-slate-500 text-[11px]">Qui peut voir votre contenu</p>
            
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/50 transition">
              <div className="flex items-center gap-3">
                <LockIcon />
                <span className="text-slate-200 font-medium">Confidentialité du compte</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Public</span>
                <ChevronRight />
              </div>
            </button>

            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/50 transition">
              <div className="flex items-center gap-3">
                <UserBlockIcon />
                <span className="text-slate-200 font-medium">Bloqué</span>
              </div>
              <ChevronRight />
            </button>
          </div>

          {/* SECTION : PLUS D'INFOS ET ASSISTANCE */}
          <div className="py-2">
            <p className="px-4 py-2 font-bold text-slate-500 text-[11px]">Plus d'infos et d'assistance</p>

            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-900/50 transition">
              <div className="flex items-center gap-3">
                <HelpIcon />
                <span className="text-slate-200 font-medium">Aide</span>
              </div>
              <ChevronRight />
            </button>
          </div>

          {/* SECTION : CONNEXION (ACTION EN ROUGE) */}
          <div className="py-3 px-4 space-y-3">
            <p className="font-bold text-slate-500 text-[11px]">Connexion</p>

            <button className="w-full text-left font-semibold text-cyan-400 hover:underline py-1">
              Ajouter un compte
            </button>

            <button 
              onClick={handleLogout}
              className="w-full text-left font-semibold text-red-500 hover:underline py-1"
            >
              Se déconnecter
            </button>
          </div>

        </div>

      </div>
    </div>
  )
  }
  
