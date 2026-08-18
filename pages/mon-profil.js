import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function MonProfil() {
  const [user, setUser] = useState(null)
  const [userStories, setUserStories] = useState([])

  useEffect(() => {
    // Récupérer l'utilisateur connecté
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchUserStories(user.id)
      }
    })
  }, [])

  const fetchUserStories = async (userId) => {
    const { data } = await supabase.from('stories').select('*').eq('user_id', userId)
    if (data) setUserStories(data)
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white p-4 max-w-lg mx-auto pb-20">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-6">
        <Link href="/" className="text-xl">⬅️</Link>
        <h1 className="text-xl font-bold">Mon Profil</h1>
      </div>

      <div className="flex flex-col items-center gap-3 text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-jild-gradient flex items-center justify-center text-3xl font-bold">
          {user?.email ? user.email[0].toUpperCase() : 'U'}
        </div>
        <div>
          <h2 className="text-lg font-bold">{user?.email || 'Utilisateur Anonyme'}</h2>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-300">Mes Publications ({userStories.length})</h3>
        {userStories.length === 0 ? (
          <p className="text-xs text-slate-500">Aucune publication pour le moment.</p>
        ) : (
          userStories.map(story => (
            <div key={story.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
              <p>{story.content}</p>
              {story.image_url && <img src={story.image_url} className="rounded-lg max-h-40 w-full object-cover" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
    }
          
