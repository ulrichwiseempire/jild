import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Parametres() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getUserProfile()
  }, [])

  const getUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setUsername(data.username || '')
        setBio(data.bio || '')
      }
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      bio,
      updated_at: new Date()
    })
    setLoading(false)
    if (error) alert(error.message)
    else alert('Profil mis à jour !')
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-4 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-3">
        <Link href="/" className="text-[#3B82F6]">⬅️ Retour</Link>
        <h1 className="text-lg font-bold">Paramètres du profil</h1>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4 text-xs">
        <div>
          <label className="text-slate-400 block mb-1">Nom d'utilisateur</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#161B22] border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-[#3B82F6]" 
          />
        </div>

        <div>
          <label className="text-slate-400 block mb-1">Bio</label>
          <textarea 
            value={bio} 
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-[#161B22] border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-[#3B82F6] h-24 resize-none" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] py-3 rounded-xl font-bold text-white"
        >
          {loading ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </form>
    </div>
  )
}
