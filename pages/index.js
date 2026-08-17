import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  // Posts, Commentaires, Likes, Follows & Recherche
  const [stories, setStories] = useState([])
  const [comments, setComments] = useState({})
  const [likes, setLikes] = useState({})
  const [following, setFollowing] = useState([]) // Liste des personnes qu'on suit
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

  // Charger la liste des abonnements quand l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      fetchFollowing()
    } else {
      setFollowing([])
    }
  }, [user])

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setStories(data)
  }

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      const grouped = data.reduce((acc, comment) => {
        acc[comment.story_id] = acc[comment.story_id] || []
        acc[comment.story_id].push(comment)
        return acc
      }, {})
      setComments(grouped)
    }
  }

  const fetchLikes = async () => {
    const { data, error } = await supabase.from('likes').select('*')
    if (!error && data) {
      const grouped = data.reduce((acc, like) => {
        acc[like.story_id] = acc[like.story_id] || []
        acc[like.story_id].push(like.user_id)
        return acc
      }, {})
      setLikes(grouped)
    }
  }

  const fetchFollowing = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
    
    if (!error && data) {
      setFollowing(data.map(item => item.following_id))
    }
  }

  const handleToggleFollow = async (authorId) => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }

    const isCurrentlyFollowing = following.includes(authorId)

    if (isCurrentlyFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', authorId)

      if (!error) {
        setFollowing(following.filter(id => id !== authorId))
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: user.id, following_id: authorId }])

      if (!error) {
        setFollowing([...following, authorId])
      }
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      })
      if (error) alert(error.message)
      else {
        alert('Compte créé avec succès !')
        setIsAuthOpen(false)
      }
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
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile)

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        avatarUrl = publicUrlData.publicUrl
      }
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        username: username || user.user_metadata?.username,
        avatar_url: avatarUrl
      }
    })

    setUploading(false)
    if (error) alert('Erreur : ' + error.message)
    else {
      alert('Profil mis à jour !')
      setIsProfileOpen(false)
    }
  }

  const handleToggleLike = async (storyId) => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }

    const storyLikes = likes[storyId] || []
    const hasLiked = storyLikes.includes(user.id)

    if (hasLiked) {
      await supabase.from('likes').delete().eq('story_id', storyId).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert([{ story_id: storyId, user_id: user.id }])
    }
    fetchLikes()
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!user) {
      setIsAuthOpen(true)
      return
    }
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

    const { error } = await supabase.from('stories').insert([
      {
        content,
        author: authorName,
        user_id: user.id,
        image_url: imageUrl,
        avatar_url: userAvatar
      }
    ])

    setUploading(false)
    if (error) alert('Erreur : ' + error.message)
    else {
      setContent('')
      setImageFile(null)
      fetchStories()
    }
  }

  const handleDeleteStory = async (id) => {
    if (confirm('Voulez-vous supprimer ce post ?')) {
      const { error } = await supabase.from('stories').delete().eq('id', id)
      if (!error) fetchStories()
    }
  }

  const handleAddComment = async (storyId) => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }
    const commentText = newComment[storyId]
    if (!commentText?.trim()) return

    const authorName = user.user_metadata?.username || user.email.split('@')[0]

    const { error } = await supabase.from('comments').insert([
      {
        story_id: storyId,
        content: commentText,
        author_name: authorName,
        user_id: user.id
      }
    ])

    if (!error) {
      setNewComment({ ...newComment, [storyId]: '' })
      fetchComments()
    }
  }

  // Filtrage des posts selon la recherche
  const filteredStories = stories.filter(story => 
    story.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.author?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* HEADER FACEBOOK STYLE */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center gap-4">
          <h1 className="text-2xl font-black text-sky-400">JILD</h1>

          {/* BARRE DE RECHERCHE */}
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="🔍 Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-xs text-white outline-none focus:border-sky-500"
            />
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold">
                      {(user.user_metadata?.username || user.email).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs hidden sm:inline">{user.user_metadata?.username || user.email.split('@')[0]}</span>
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  🚪
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg font-semibold"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-2xl mx-auto w-full p-4 flex-grow space-y-6">

        {/* MODAL AUTHENTIFICATION */}
        {isAuthOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md relative">
              <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
              <h2 className="text-xl font-bold mb-4">{isSignUp ? 'Inscription' : 'Connexion'}</h2>
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <input
                    type="text"
                    placeholder="Pseudo"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
                <button type="submit" className="w-full bg-sky-600 py-3 rounded-xl font-semibold text-xs text-white">
                  {isSignUp ? 'S\'inscrire' : 'Se connecter'}
                </button>
              </form>
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-sky-400 mt-4 block text-center w-full">
                {isSignUp ? 'Déjà un compte ? Se connecter' : 'Créer un compte'}
              </button>
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
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Changer le pseudo</label>
                  <input
                    type="text"
                    placeholder="Nouveau pseudo"
                    defaultValue={user?.user_metadata?.username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Photo de profil</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    className="text-xs text-slate-400"
                  />
                </div>
                <button type="submit" disabled={uploading} className="w-full bg-sky-600 py-3 rounded-xl font-semibold text-xs text-white">
                  {uploading ? 'Mise à jour...' : 'Sauvegarder'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* BLOC DE PUBLICATION */}
        <section className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex gap-3 items-center">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold">
                {user ? (user.user_metadata?.username || user.email).charAt(0).toUpperCase() : '👤'}
              </div>
            )}
            <textarea
              placeholder={user ? `Qu'as-tu à dire aujourd'hui, ${user.user_metadata?.username || user.email.split('@')[0]} ?` : "Connecte-toi pour publier..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onClick={() => { if (!user) setIsAuthOpen(true) }}
              rows="2"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none resize-none"
            />
          </div>

          {imageFile && (
            <div className="relative mt-2">
              <img src={URL.createObjectURL(imageFile)} alt="Aperçu" className="max-h-40 rounded-xl object-cover w-full" />
              <button onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-6 h-6 text-xs">✕</button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-sky-400">
              📷 Ajouter une photo
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (!user) setIsAuthOpen(true); else setImageFile(e.target.files[0]) }} />
            </label>
            <button onClick={handlePublish} disabled={uploading} className="bg-sky-600 hover:bg-sky-500 px-5 py-2 rounded-xl font-semibold text-xs text-white">
              {uploading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </section>

        {/* FEED / PUBLICATIONS */}
        <section className="space-y-4">
          {filteredStories.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Aucun résultat pour cette recherche.</p>
          ) : (
            filteredStories.map((story) => {
              const storyLikes = likes[story.id] || []
              const hasLiked = user && storyLikes.includes(user.id)
              const isFollowingAuthor = following.includes(story.user_id)

              return (
                <article key={story.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  
                  {/* EN-TÊTE DU POST */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {story.avatar_url ? (
                        <img src={story.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-sm">
                          {story.author ? story.author.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-200 text-sm">{story.author}</p>
                          
                          {/* BOUTON SUIVRE / S'ABONNER */}
                          {user && story.user_id && story.user_id !== user.id && (
                            <button
                              onClick={() => handleToggleFollow(story.user_id)}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold transition ${
                                isFollowingAuthor
                                  ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                  : 'bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white'
                              }`}
                            >
                              {isFollowingAuthor ? 'Abonné' : '+ Suivre'}
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">{new Date(story.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {user && story.user_id === user.id && (
                      <button onClick={() => handleDeleteStory(story.id)} className="text-xs text-red-400 bg-red-950/40 px-2 py-1 rounded-lg">Supprimer</button>
                    )}
                  </div>

                  {story.content && <p className="text-slate-300 text-sm whitespace-pre-line">{story.content}</p>}

                  {story.image_url && (
                    <div className="rounded-xl overflow-hidden border border-slate-800">
                      <img src={story.image_url} alt="Post" className="w-full max-h-96 object-cover" />
                    </div>
                  )}

                  {/* BARRE INTERACTION (LIKES) */}
                  <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
                    <button 
                                            onClick={() => handleToggleLike(story.id)}
                      className={`flex items-center gap-1.5 font-medium transition ${hasLiked ? 'text-red-500' : 'hover:text-red-400'}`}
                    >
                      <span>{hasLiked ? '❤️' : '🤍'}</span>
                      <span>{storyLikes.length} {storyLikes.length > 1 ? 'J\'aime' : 'J\'aime'}</span>
                    </button>
                    <span>💬 {(comments[story.id] || []).length} Commentaires</span>
                  </div>

                  {/* COMMENTAIRES */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    {(comments[story.id] || []).map((c) => (
                      <div key={c.id} className="bg-slate-950 p-2 rounded-xl border border-slate-800/50 text-xs">
                        <span className="font-semibold text-sky-400">{c.author_name} : </span>
                        <span className="text-slate-300">{c.content}</span>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Commenter..."
                        value={newComment[story.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [story.id]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(story.id) }}
                        className="flex-grow p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none"
                      />
                      <button onClick={() => handleAddComment(story.id)} className="bg-slate-800 px-3 py-2 rounded-lg text-xs text-sky-400 font-semibold">
                        Poster
                      </button>
                    </div>
                  </div>

                </article>
              )
            })
          )}
        </section>

      </main>

      <footer className="border-t border-slate-800 bg-slate-950 p-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} JILD — Plateforme Sociale</p>
      </footer>

    </div>
  )
}
