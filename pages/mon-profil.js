import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function MonProfil() {
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [userStories, setUserStories] = useState([])
  const [activeTab, setActiveTab] = useState('grid')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        fetchUserProfile(user.id)
        fetchUserStories(user.id)
      }
    })
  }, [])

  // Récupère les infos complètes (certification, bio, nom)
  const fetchUserProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) setProfileData(data)
  }

  // Récupère les publications de l'utilisateur
  const fetchUserStories = async (userId) => {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      
    if (data) setUserStories(data)
  }

  const username = user?.email ? user.email.split('@')[0] : 'utilisateur'
  const isVerified = profileData?.is_verified || false

  return (
    <div className="min-h-screen bg-[#090d16] text-white max-w-lg mx-auto pb-24 font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* 1. HEADER NAV */}
      <div className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg hover:opacity-80 transition">⬅️</Link>
          <span className="font-bold text-base tracking-wide flex items-center gap-1">
            {username}
            {/* Vrai badge dynamique : s'affiche uniquement si is_verified === true */}
            {isVerified && <span className="text-cyan-400 text-xs">☑️</span>}
          </span>
        </div>
        <div className="flex items-center gap-4 text-lg">
          <button className="hover:opacity-80">➕</button>
          <button className="hover:opacity-80">⚙️</button>
        </div>
      </div>

      {/* 2. INFOS PROFIL (Style Instagram / Twitter) */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          {/* Photo de profil */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600">
              <div className="w-full h-full rounded-full bg-slate-900 border-2 border-[#090d16] flex items-center justify-center font-bold text-2xl text-cyan-400">
                {username[0]?.toUpperCase()}
              </div>
            </div>
            <button className="absolute bottom-0 right-0 bg-cyan-500 text-black w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs border-2 border-[#090d16]">
              +
            </button>
          </div>

          {/* Stats : Posts / Followers / Suivis */}
          <div className="flex-1 flex justify-around text-center">
            <div>
              <div className="font-bold text-base">{userStories.length}</div>
              <div className="text-xs text-slate-400">publications</div>
            </div>
            <div>
              <div className="font-bold text-base">0</div>
              <div className="text-xs text-slate-400">followers</div>
            </div>
            <div>
              <div className="font-bold text-base">0</div>
              <div className="text-xs text-slate-400">suivi(s)</div>
            </div>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="space-y-1 text-xs">
          <div className="font-bold text-sm flex items-center gap-1">
            {profileData?.full_name || username}
            {isVerified && <span className="text-cyan-400">✔</span>}
          </div>
          {profileData?.bio ? (
            <p className="text-slate-200">{profileData.bio}</p>
          ) : (
            <p className="text-slate-400 italic">Aucune bio renseignée.</p>
          )}
          
          {profileData?.website && (
            <a href={profileData.website} target="_blank" rel="noreferrer" className="text-cyan-400 font-semibold block hover:underline">
              🔗 {profileData.website}
            </a>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button className="bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold py-2 rounded-lg border border-slate-700/60 transition">
            Modifier le profil
          </button>
          <button className="bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold py-2 rounded-lg border border-slate-700/60 transition">
            Partager le profil
          </button>
        </div>
      </div>

      {/* 3. ONGLETS DE NAVIGATION DE GRILLE */}
      <div className="flex border-t border-slate-800 mt-2">
        <button 
          onClick={() => setActiveTab('grid')}
          className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition ${activeTab === 'grid' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500'}`}
        >
          ▦ Grille
        </button>
        <button 
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition ${activeTab === 'list' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500'}`}
        >
          📄 Flux
        </button>
      </div>

      {/* 4. CONTENU (Grille Insta ou Liste) */}
      {activeTab === 'grid' ? (
        <div className="grid grid-cols-3 gap-0.5 pt-0.5">
          {userStories.map((story) => (
            <div key={story.id} className="aspect-square bg-slate-900 relative overflow-hidden group">
              {story.image_url ? (
                <img src={story.image_url} alt="Post" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full p-2 bg-slate-800/60 flex items-center justify-center text-[10px] text-slate-300 text-center line-clamp-3">
                  {story.content}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {userStories.map((story) => (
            <div key={story.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
              <p>{story.content}</p>
              {story.image_url && <img src={story.image_url} className="rounded-lg w-full max-h-60 object-cover" />}
            </div>
          ))}
        </div>
      )}

      {/* BARRE DE NAVIGATION EN BAS */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#090d16]/95 border-t border-slate-800/80 py-2.5 px-6 flex justify-around items-center backdrop-blur-md">
        <Link href="/" className="text-xl">🏠</Link>
        <Link href="/messages" className="text-xl">💬</Link>
        <button className="w-10 h-10 rounded-full bg-jild-gradient flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
          +
        </button>
        <button className="text-xl">🔔</button>
        <Link href="/mon-profil" className="text-xl opacity-100 scale-110">👤</Link>
      </nav>

    </div>
  )
}
