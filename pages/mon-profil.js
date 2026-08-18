import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Composants Icônes SVG Professionnels (pas d'émojis)
const Icons = {
  Home: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  ),
  Message: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
  ),
  PlusSquare: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  Bell: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  ),
  User: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ),
  ArrowLeft: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
  ),
  Settings: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  ),
  Grid: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
  ),
  VerifiedBadge: () => (
    <svg className="w-4 h-4 text-cyan-400 fill-current inline-block ml-1" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
  )
}

export default function MonProfil() {
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [userStories, setUserStories] = useState([])
  const [selectedStory, setSelectedStory] = useState(null) // Pour ouvrir le post en grand
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

  const fetchUserProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setProfileData(data)
  }

  const fetchUserStories = async (userId) => {
    const { data } = await supabase.from('stories').select('*').eq('user_id', userId)
    if (data) setUserStories(data)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Profil JILD de ${username}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Lien du profil copié !')
    }
  }

  const username = user?.email ? user.email.split('@')[0] : 'utilisateur'
  const isVerified = profileData?.is_verified || false

  return (
    <div className="min-h-screen bg-[#090d16] text-white max-w-lg mx-auto pb-24 font-sans border-x border-slate-800/60">
      
      {/* HEADER NAV */}
      <div className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-300 hover:text-white transition">
            <Icons.ArrowLeft />
          </Link>
          <span className="font-bold text-base tracking-wide flex items-center">
            {username}
            {isVerified && <Icons.VerifiedBadge />}
          </span>
        </div>
        <button className="text-slate-300 hover:text-white transition">
          <Icons.Settings />
        </button>
      </div>

      {/* INFOS PROFIL */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600">
              <div className="w-full h-full rounded-full bg-slate-900 border-2 border-[#090d16] flex items-center justify-center font-bold text-2xl text-cyan-400 overflow-hidden">
                {profileData?.avatar_url ? (
                  <img src={profileData.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  username[0]?.toUpperCase()
                )}
              </div>
            </div>
          </div>

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

        {/* Bio */}
        <div className="space-y-1 text-xs">
          <div className="font-bold text-sm flex items-center">
            {profileData?.full_name || username}
            {isVerified && <Icons.VerifiedBadge />}
          </div>
          {profileData?.bio ? (
            <p className="text-slate-200">{profileData.bio}</p>
          ) : (
            <p className="text-slate-500 italic">Aucune bio renseignée.</p>
          )}
          {profileData?.website && (
            <a href={profileData.website} target="_blank" rel="noreferrer" className="text-cyan-400 font-semibold block hover:underline">
              🔗 {profileData.website}
            </a>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2.5 rounded-lg border border-slate-700/60 transition active:scale-95">
            Modifier le profil
          </button>
          <button onClick={handleShare} className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2.5 rounded-lg border border-slate-700/60 transition active:scale-95">
            Partager le profil
          </button>
        </div>
      </div>

      {/* ONGLETS GRILLE */}
      <div className="flex border-t border-slate-800 mt-2">
        <button 
          onClick={() => setActiveTab('grid')}
          className={`flex-1 py-3 flex justify-center items-center gap-2 text-sm font-semibold border-b-2 transition ${activeTab === 'grid' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500'}`}
        >
          <Icons.Grid /> Grille
        </button>
      </div>

      {/* GRILLE PHOTOS / VIDEOS */}
      <div className="grid grid-cols-3 gap-0.5 pt-0.5">
        {userStories.map((story) => (
          <div 
            key={story.id} 
            onClick={() => setSelectedStory(story)}
            className="aspect-square bg-slate-900 relative overflow-hidden cursor-pointer active:opacity-80 transition"
          >
            {story.image_url ? (
              <img src={story.image_url} alt="Post" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full p-2 bg-slate-800/80 flex items-center justify-center text-[10px] text-slate-300 text-center line-clamp-3">
                {story.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODALE DE PUBLICATION EN GRAND (Clic sur la grille) */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden p-4 space-y-3 relative">
            <button 
              onClick={() => setSelectedStory(null)}
              className="absolute top-3 right-3 bg-slate-800 text-slate-300 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>
            <div className="font-bold text-sm text-cyan-400">@{username}</div>
            {selectedStory.image_url && (
              <img src={selectedStory.image_url} className="rounded-xl w-full max-h-80 object-cover" />
            )}
            <p className="text-sm text-slate-200">{selectedStory.content}</p>
          </div>
        </div>
      )}

      {/* BARRE DE NAVIGATION EN BAS AVEC VRAIES ICÔNES */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-[#090d16]/95 border-t border-slate-800/80 py-3 px-6 flex justify-around items-center backdrop-blur-md z-40">
        <Link href="/" className="text-slate-400 hover:text-cyan-400 transition">
          <Icons.Home />
        </Link>
        <Link href="/messages" className="text-slate-400 hover:text-cyan-400 transition">
          <Icons.Message />
        </Link>
        <button className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20 active:scale-90 transition">
          <Icons.PlusSquare />
        </button>
        <button className="text-slate-400 hover:text-cyan-400 transition">
          <Icons.Bell />
        </button>
        <Link href="/mon-profil" className="text-cyan-400 scale-110">
          <Icons.User />
        </Link>
      </nav>

    </div>
  )
    }
