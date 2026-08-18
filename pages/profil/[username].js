import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function ProfilPublic() {
  const router = useRouter()
  const { username } = router.query
  const [profile, setProfile] = useState(null)
  const [stories, setStories] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (username) {
      fetchProfileData()
    }
  }, [username])

  const fetchProfileData = async () => {
    // Récupérer les publications liées au pseudo
    const { data: posts } = await supabase.from('stories').select('*').eq('user_id', username)
    if (posts) setStories(posts)
  }

  const toggleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white max-w-lg mx-auto pb-24 font-sans border-x border-slate-800/60">
      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-slate-300 hover:text-white transition">⬅️</Link>
        <span className="font-bold text-base">@{username}</span>
        <div className="w-6"></div>
      </div>

      {/* DETALS PROFIL */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-cyan-500 flex items-center justify-center font-bold text-2xl text-cyan-400">
            {username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 flex justify-around text-center">
            <div>
              <div className="font-bold text-base">{stories.length}</div>
              <div className="text-xs text-slate-400">publications</div>
            </div>
            <div>
              <div className="font-bold text-base">{isFollowing ? 1 : 0}</div>
              <div className="text-xs text-slate-400">followers</div>
            </div>
            <div>
              <div className="font-bold text-base">0</div>
              <div className="text-xs text-slate-400">suivi(s)</div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button 
            onClick={toggleFollow}
            className={`py-2.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
              isFollowing 
                ? 'bg-slate-800 text-white border border-slate-700' 
                : 'bg-cyan-500 text-black font-bold'
            }`}
          >
            {isFollowing ? 'Abonné(e)' : 'S\'abonner'}
          </button>
          <Link 
            href="/messages"
            className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold py-2.5 rounded-lg border border-slate-700/60 transition active:scale-95 text-center flex items-center justify-center"
          >
            Message
          </Link>
        </div>
      </div>

      {/* GRILLE */}
      <div className="grid grid-cols-3 gap-0.5 border-t border-slate-800 pt-0.5">
        {stories.map((story) => (
          <div key={story.id} className="aspect-square bg-slate-900 overflow-hidden">
            {story.image_url ? (
              <img src={story.image_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full p-2 flex items-center justify-center text-[10px] text-slate-400 text-center">
                {story.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
    }
        
