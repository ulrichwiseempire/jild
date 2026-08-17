import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  
  // Modales & Menus
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  // Posts, Commentaires, Likes, Follows & Recherche
  const [stories, setStories] = useState([])
  const [comments, setComments] = useState({})
  const [likes, setLikes] = useState({})
  const [following, setFollowing] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // Formulaires
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [newComment, setNewComment] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    fetchStories()
    fetchComments()
    fetchLikes()

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) fetchFollowing()
    else setFollowing([])
  }, [user])

  const fetchStories = async () => {
    const { data, error } = await supabase.from('stories').select('*').order('created_at', { ascending: false })
    if (!error) setStories(data)
  }

  const fetchComments = async () => {
    const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: true })
    if (!error && data) {
      const grouped = data.reduce((acc, c) => { acc[c.story_id] = acc[c.story_id] || []; acc[c.story_id].push(c); return acc }, {})
      setComments(grouped)
    }
  }

  const fetchLikes = async () => {
    const { data, error } = await supabase.from('likes').select('*')
    if (!error && data) {
      const grouped = data.reduce((acc, l) => { acc[l.story_id] = acc[l.story_id] || []; acc[l.story_id].push(l.user_id); return acc }, {})
      setLikes(grouped)
    }
  }

  const fetchFollowing = async () => {
    if (!user) return
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    if (data) setFollowing(data.map(i => i.following_id))
  }

  const handleToggleFollow = async (authorId) => {
    if (!user) return setIsAuthOpen(true)
    if (!authorId) return alert("Cet utilisateur n'a pas d'identifiant valide.")

    if (following.includes(authorId)) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', authorId)
      setFollowing(following.filter(id => id !== authorId))
    } else {
      await supabase.from('follows').insert([{ follower_id: user.id, following_id: authorId }])
      setFollowing([...following, authorId])
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } })
      if (error) alert(error.message)
      else { alert('Compte créé !'); setIsAuthOpen(false) }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else setIsAuthOpen(false)
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
      data: { username: username || user.user_metadata?.username, avatar_url: avatarUrl }
    })
    setUploading(false)
    if (error) alert('Erreur : ' + error.message)
    else { alert('Profil mis à jour !'); setIsProfileOpen(false) }
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!user) return setIsAuthOpen(true)
    if (!content.trim() && !imageFile) return

    setUploading(true)
    let imageUrl = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, imageFile)
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('posts').getPublicUrl(fileName)
        imageUrl = publicUrlData.publicUrl
      }
    }

    const authorName = user.user_metadata?.username || user.email.split('@')[0]
    const userAvatar = user.user_metadata?.avatar_url || null

    const { error } = await supabase.from('stories').insert([{
      content, author: authorName, user_id: user.id, image_url: imageUrl, avatar_url: userAvatar
    }])

    setUploading(false)
    if (!error) { setContent(''); setImageFile(null); fetchStories() }
  }

  const handleDeleteStory = async (id) => {
    if (confirm('Voulez-vous supprimer ce post ?')) {
      const { error } = await supabase.from('stories').delete().eq('id', id)
      if (!error) fetchStories()
    }
  }

  const handleToggleLike = async (storyId) => {
    if (!user) return setIsAuthOpen(true)
    const hasLiked = (likes[storyId] || []).includes(user.id)
    if (hasLiked) await supabase.from('likes').delete().eq('story_id', storyId).eq('user_id', user.id)
    else await supabase.from('likes').insert([{ story_id: storyId, user_id: user.id }])
    fetchLikes()
  }

  const handleAddComment = async (storyId) => {
    if (!user) return setIsAuthOpen(true)
    const commentText = newComment[storyId]
    if (!commentText?.trim()) return
    const authorName = user.user_metadata?.username || user.email.split('@')[0]

    const { error } = await supabase.from('comments').insert([{
      story_id: storyId, content: commentText, author_name: authorName, user_id: user.id
    }])
    if (!error) { setNewComment({ ...newComment, [storyId]: '' }); fetchComments() }
  }

  const filteredStories = stories.filter(s => 
    s.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.author?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans pb-16">
      
      {/* HEADER AVEC RECHERCHE ET MENU BURGER */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
          <h1 className="text-2xl font-black text-sky-400">JILD</h1>

          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="🔍 Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-xs text-white outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* MENU BURGER (3 TRAITS) */}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="text-2xl p-1 text-slate-300 hover:text-white transition"
                >
                  ☰
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)} 
                className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg font-semibold"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* FEED PRINCIPAL */}
      <main className="max-w-2xl mx-auto w-full p-4 flex-grow space-y-6">

        {/* MODAL AUTHENTIFICATION */}
        {isAuthOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md relative">
              <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
              <h2 className="text-xl font-bold mb-4">{isSignUp ? 'Inscription' : 'Connexion'}</h2>
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && <input type="text" placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" required />}
                <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" required />
                <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" required />
                <button type="submit" className="w-full bg-sky-600 py-3 rounded-xl font-semibold text-xs text-white">{isSignUp ? 'S\'inscrire' : 'Se connecter'}</button>
              </form>
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-sky-400 mt-4 block text-center w-full">{isSignUp ? 'Déjà un compte ?' : 'Créer un compte'}</button>
            </div>
          </div>
        )}

        {/* MODAL PROFIL */}
        {isProfileOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md relative space-y-4">
              <button onClick={() => setIsProfileOpen(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
              <h2 className="text-xl font-bold">Mon Profil</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <input type="text" placeholder="Nouveau pseudo" defaultValue={user?.user_metadata?.username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} className="text-xs text-slate-400" />
                <button type="submit" disabled={uploading} className="w-full bg-sky-600 py-3 rounded-xl font-semibold text-xs text-white">{uploading ? 'Mise à jour...' : 'Sauvegarder'}</button>
              </form>
            </div>
          </div>
        )}

        {/* VOLET PARAMÈTRES ET ACTIVITÉ (FIXÉ : PADDING BAS PUSH-UP) */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex justify-end">
            <div className="bg-slate-900 w-full max-w-sm h-full p-5 pb-24 flex flex-col justify-between border-l border-slate-800 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">⚙️ Paramètres et activité</h2>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisation personnelle</div>
                  <button onClick={() => { setIsSettingsOpen(false); setIsProfileOpen(true); }} className="w-full text-left py-2 flex items-center gap-3 hover:text-sky-400">👤 Modifier le profil</button>
                  <button onClick={() => alert('Aucun contenu enregistré pour le moment.')} className="w-full text-left py-2 flex items-center gap-3 hover:text-sky-400">🔖 Enregistré</button>
                  <button onClick={() => alert('Votre historique d\'activité est vide.')} className="w-full text-left py-2 flex items-center gap-3 hover:text-sky-400">📊 Votre activité</button>
                  <button onClick={() => alert('Vous n\'avez aucune notification.')} className="w-full text-left py-2 flex items-center gap-3 hover:text-sky-400">🔔 Notifications</button>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-4 space-y-3 mb-6">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Connexion</div>
                <button 
                  onClick={() => { supabase.auth.signOut(); setIsSettingsOpen(false); }} 
                  className="w-full text-left py-2 text-red-500 font-bold hover:text-red-400 transition"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PUBLICATION */}
        <section className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex gap-3 items-center">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold">{user ? (user.user_metadata?.username || user.email).charAt(0).toUpperCase() : '👤'}</div>
            )}
            <textarea placeholder={user ? `Qu'as-tu à dire, ${user.user_metadata?.username || user.email.split('@')[0]} ?` : "Connecte-toi pour publier..."} value={content} onChange={(e) => setContent(e.target.value)} onClick={() => { if (!user) setIsAuthOpen(true) }} rows="2" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none resize-none" />
          </div>
          {imageFile && (
            <div className="relative mt-2">
              <img src={URL.createObjectURL(imageFile)} className="max-h-40 rounded-xl object-cover w-full" />
              <button onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-6 h-6 text-xs">✕</button>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-sky-400">📷 Photo <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (!user) setIsAuthOpen(true); else setImageFile(e.target.files[0]) }} /></label>
            <button onClick={handlePublish} disabled={uploading} className="bg-sky-600 hover:bg-sky-500 px-5 py-2 rounded-xl font-semibold text-xs text-white">{uploading ? '...' : 'Publier'}</button>
          </div>
        </section>

        {/* LISTE DES POSTS */}
        <section className="space-y-4">
          {filteredStories.map((story) => {
            const storyLikes = likes[story.id] || []
            const hasLiked = user && storyLikes.includes(user.id)
            const isFollowingAuthor = following.includes(story.user_id)

            return (
              <article key={story.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  
                  {/* PROFILE AUTEUR CLIQUABLE */}
                  <Link href={story.user_id ? `/mon-profil` : '#'} className="flex items-center gap-3 hover:opacity-80">
                    {story.avatar_url ? (
                      <img src={story.avatar_url} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-sm">
                        {story.author ? story.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{story.author}</p>
                      <p className="text-[10px] text-slate-500">{new Date(story.created_at).toLocaleDateString()}</p>
                    </div>
                  </Link>

                  {/* BOUTON SUIVRE OU SUPPRIMER */}
                  <div className="flex items-center gap-2">
                    {user && story.user_id && story.user_id !== user.id && (
                      <button
                        onClick={() => handleToggleFollow(story.user_id)}
                        className={`text-[10px] px-3 py-1 rounded-full font-semibold transition ${
                          isFollowingAuthor
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-sky-500 text-white hover:bg-sky-400'
                        }`}
                      >
                        {isFollowingAuthor ? 'Abonné' : '+ Suivre'}
                      </button>
                    )}
                    {user && story.user_id === user.id && (
                      <button onClick={() => handleDeleteStory(story.id)} className="text-xs text-red-400 bg-red-950/40 px-2 py-1 rounded-lg">Supprimer</button>
                    )}
                  </div>
                </div>

                {story.content && <p className="text-slate-300 text-sm whitespace-pre-line">{story.content}</p>}
                {story.image_url && <img src={story.image_url} className="w-full max-h-96 object-cover rounded-xl border border-slate-800" />}

                <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
                  <button onClick={() => handleToggleLike(story.id)} className={hasLiked ? 'text-red-500 font-bold' : ''}>
                    {hasLiked ? '❤️' : '🤍'} {storyLikes.length} J'aime
                  </button>
                  <span>💬 {(comments[story.id] || []).length} Commentaires</span>
                </div>

                {/* COMMENTAIRES */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  {(comments[story.id] || []).map((c) => (
                    <div key={c.id} className="bg-slate-950 p-2 rounded-xl text-xs border border-slate-800/50">
                      <span className="font-semibold text-sky-400">{c.author_name} : </span>
                      <span className="text-slate-300">{c.content}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input type="text" placeholder="Commenter..." value={newComment[story.id] || ''} onChange={(e) => setNewComment({ ...newComment, [story.id]: e.target.value })} className="flex-grow p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none" />
                                  <button onClick={() => handleAddComment(story.id)} className="bg-slate-800 px-3 py-2 rounded-lg text-xs text-sky-400 font-semibold">Poster</button>
            </div>
          </div>

        </article>
      )
    })}
  </section>
</main>

{/* BARRE DE NAVIGATION EN BAS */}
<nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 py-3 px-6 z-40">
  <div className="max-w-md mx-auto flex justify-between items-center text-white">
    
    <Link href="/" className="hover:opacity-70 transition">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 00-1 1m-6 0h6" />
      </svg>
    </Link>

    <button onClick={() => alert('Fonctionnalité Reels bientôt disponible !')} className="hover:opacity-70 transition opacity-60">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>

    <Link href="/messages" className="hover:opacity-70 transition">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.6 11.2L4.8 2.6C3.9 2.1 2.9 3.1 3.4 4L12 20.8c.4.8 1.6.8 2 0l2.3-4.6 4.6-2.3c.8-.4.8-1.6 0-2z" />
      </svg>
    </Link>

    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:opacity-70 transition">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>

    {/* LIEN PROFIL DANS LA BARRE DU BAS */}
    <Link href="/mon-profil" className="w-7 h-7 rounded-full overflow-hidden border border-white block">
      {user?.user_metadata?.avatar_url ? (
        <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-sky-600 flex items-center justify-center text-[10px] font-bold">
          {user ? (user.user_metadata?.username || user.email).charAt(0).toUpperCase() : '👤'}
        </div>
      )}
    </Link>

  </div>
</nav>

</div>
)
  }
  
