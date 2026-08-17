import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function MonProfil() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [userPosts, setUserPosts] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setUsername(session.user.user_metadata?.username || '')
        fetchUserPosts(session.user.id)
      }
    })
  }, [])

  const fetchUserPosts = async (userId) => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setUserPosts(data)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!user) return
    setUploading(true)
    let avatarUrl = user.user_metadata?.avatar_url || null

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile)
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        avatarUrl = publicUrlData.publicUrl
      }
    }

    const { error } = await supabase.auth.updateUser({
      data: { username, avatar_url: avatarUrl }
    })

    setUploading(false)
    if (error) alert('Erreur : ' + error.message)
    else alert('Profil mis à jour avec succès !')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-20 font-sans max-w-2xl mx-auto">
      
      {/* HEADER DE NAVIGATION */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <Link href="/" className="text-sky-400 font-semibold text-sm flex items-center gap-1">
          ← Retour
        </Link>
        <h1 className="text-xl font-bold">Mon Profil</h1>
        <div className="w-12"></div>
      </div>

      {/* FORMULAIRE DE PROFIL */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 mb-8">
        <div className="flex flex-col items-center gap-4">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-24 h-24 rounded-full object-cover border-2 border-sky-500" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-sky-600 flex items-center justify-center text-3xl font-bold text-white border-2 border-sky-500">
              {user ? (user.user_metadata?.username || user.email).charAt(0).toUpperCase() : '👤'}
            </div>
          )}
          <span className="text-xs text-slate-400">{user?.email}</span>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Pseudo</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none focus:border-sky-500" 
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Photo de profil</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setAvatarFile(e.target.files[0])} 
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-sky-400 font-semibold" 
            />
          </div>

          <button 
            type="submit" 
            disabled={uploading} 
            className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-semibold text-xs text-white transition"
          >
            {uploading ? 'Enregistrement...' : 'Mettre à jour le profil'}
          </button>
        </form>
      </div>

      {/* MES PUBLICATIONS */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Mes publications</h2>
        {userPosts.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Vous n&apos;avez encore rien publié.</p>
        ) : (
          userPosts.map((post) => (
            <div key={post.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
              {post.content && <p className="text-sm text-slate-200">{post.content}</p>}
              {post.image_url && <img src={post.image_url} className="w-full max-h-60 object-cover rounded-lg mt-2" />}
            </div>
          ))
        )}
      </div>

    </div>
  )
                }
                
