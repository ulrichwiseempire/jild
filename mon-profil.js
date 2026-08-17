import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [myStories, setMyStories] = useState([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isEditOpen, setIsEditOpen] = useState(false)
  
  // Champs d'édition
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfileData(session.user.id)
      }
    })
  }, [])

  const fetchProfileData = async (userId) => {
    // 1. Récupérer mes publications
    const { data: posts } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (posts) setMyStories(posts)

    // 2. Compter mes abonnés (followers)
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
    setFollowerCount(followers || 0)

    // 3. Compter mes abonnements (following)
    const { count: followings } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)
    setFollowingCount(followings || 0)
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
      data: { username: username || user.user_metadata?.username, avatar_url: avatarUrl }
    })

    setUploading(false)
    if (error) alert('Erreur : ' + error.message)
    else {
      alert('Profil mis à jour !')
      setIsEditOpen(false)
      window.location.reload()
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <p className="mb-4 text-slate-400">Connecte-toi pour voir ton profil.</p>
        <Link href="/" className="bg-sky-600 px-4 py-2 rounded-xl text-sm font-semibold">Retour à l'accueil</Link>
      </div>
    )
  }

  const userDisplayName = user.user_metadata?.username || user.email.split('@')[0]
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 font-sans">
      
      {/* HEADER TOP */}
      <header className="border-b border-slate-800 p-4 sticky top-0 bg-slate-950/80 backdrop-blur-md flex justify-between items-center max-w-xl mx-auto">
        <h1 className="font-bold text-lg">{userDisplayName}</h1>
        <Link href="/" className="text-slate-400 text-sm hover:text-white">✕</Link>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">

        {/* PROFILE HEADER STYLE INSTAGRAM */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-20 h-20 rounded-full object-cover border-2 border-slate-700" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-sky-600 flex items-center justify-center text-2xl font-bold">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 flex justify-around text-center">
            <div>
              <p className="font-bold text-base">{myStories.length}</p>
              <p className="text-xs text-slate-400">publications</p>
            </div>
            <div>
              <p className="font-bold text-base">{followerCount}</p>
              <p className="text-xs text-slate-400">abonnés</p>
            </div>
            <div>
              <p className="font-bold text-base">{followingCount}</p>
              <p className="text-xs text-slate-400">abonnements</p>
            </div>
          </div>
        </div>

        {/* BIO & NOM */}
        <div>
          <h2 className="font-bold text-sm">{userDisplayName}</h2>
          <p className="text-xs text-slate-400 mt-1">Membre JILD</p>
        </div>

        {/* BOUTONS ACTIONS */}
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditOpen(true)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl text-xs font-semibold"
          >
            Modifier le profil
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Lien de votre profil copié !')
            }}
            className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl text-xs font-semibold"
          >
            Partager le profil
          </button>
        </div>

        {/* GRILLE DES PUBLICATIONS */}
        <div className="border-t border-slate-800 pt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Mes Publications</h3>
          
          {myStories.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-8">Aucune publication pour le moment.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {myStories.map((story) => (
                <div key={story.id} className="aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800/60 relative">
                  {story.image_url ? (
                    <img src={story.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full p-2 flex items-center justify-center text-[10px] text-slate-400 text-center line-clamp-3">
                      {story.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* MODAL EDITER LE PROFIL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md relative space-y-4">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
            <h2 className="text-lg font-bold">Modifier le profil</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Pseudo</label>
                <input 
                  type="text" 
                  defaultValue={userDisplayName} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" 
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Photo de profil</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setAvatarFile(e.target.files[0])} 
                  className="text-xs text-slate-400" 
                />
              </div>
              <button 
                type="submit" 
                disabled={uploading} 
                className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-semibold text-xs text-white"
              >
                {uploading ? 'Mise à jour...' : 'Sauvegarder'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BARRE DE NAVIGATION EN BAS */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 py-3 px-6 z-40">
        <div className="max-w-md mx-auto flex justify-between items-center text-white">
          <Link href="/" className="hover:opacity-70 transition">
            🏠
          </Link>
          <Link href="/mon-profil" className="w-7 h-7 rounded-full overflow-hidden border border-sky-400 block">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-sky-600 flex items-center justify-center text-[10px] font-bold">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </nav>

    </div>
  )
      }
    
