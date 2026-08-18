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
  
  // États
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [stories, setStories] = useState([])
  const [comments, setComments] = useState({})
  const [likes, setLikes] = useState({})
  const [following, setFollowing] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  // Publication
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
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
    if (!authorId) return

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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex justify-center font-sans">

      {/* ─────────────────────────────────────────────────────────────
          1. MENU LATÉRAL FIXE (DESKTOP / TABLETTE)
      ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 border-r border-slate-800/80 p-6 z-30 bg-[#090d16]">
        <div className="space-y-8">
          {/* LOGO JILD */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-jild-gradient flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-purple-500/20">
              J
            </div>
            <span className="text-2xl font-black tracking-wider text-jild-gradient">JILD</span>
          </div>

          {/* NAVIGATION PRINCIPALE */}
          <nav className="space-y-2">
            <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-800/50 text-white font-semibold transition hover:bg-slate-800">
              <span className="text-xl">🏠</span> Accueil
            </Link>
            <button onClick={() => alert('Fonctionnalité Explorer à venir')} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition">
              <span className="text-xl">🔍</span> Explorer
            </button>
            <Link href="/messages" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition">
              <span className="text-xl">💬</span> Messages
            </Link>
            <button onClick={() => alert('Aucune nouvelle notification')} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition">
              <span className="text-xl">🔔</span> Notifications
            </button>
            <Link href="/mon-profil" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition">
              <span className="text-xl">👤</span> Mon Profil
            </Link>
          </nav>
        </div>

        {/* PROFIL EN BAS DU MENU */}
        <div className="border-t border-slate-800/80 pt-4">
          {user ? (
            <div className="flex items-center justify-between">
              <Link href="/mon-profil" className="flex items-center gap-3 hover:opacity-80">
                <div className="w-10 h-10 rounded-full bg-jild-gradient p-[2px]">
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-bold text-sm">
                    {user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-white truncate">{user.user_metadata?.username || user.email.split('@')[0]}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
              </Link>
              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                className="text-slate-400 hover:text-red-400 text-sm p-1"
                title="Déconnexion"
              >
                🚪
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="w-full py-3 bg-jild-gradient rounded-xl font-bold text-sm text-white shadow-lg shadow-cyan-500/10 hover:opacity-90 transition"
            >
              Se connecter
            </button>
          )}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          2. FLUX PRINCIPAL (FEED CENTRAL)
      ───────────────────────────────────────────────────────────── */}
      <main className="w-full max-w-xl border-r border-slate-800/80 min-h-screen pb-24 md:pb-8">

        {/* HEADER MOBILE UNIQUEMENT */}
        <header className="md:hidden sticky top-0 z-30 bg-[#090d16]/90 backdrop-blur-md p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-jild-gradient flex items-center justify-center font-black text-lg text-white">
              J
            </div>
            <span className="text-xl font-black text-jild-gradient">JILD</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="🔍 Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs text-white outline-none focus:border-cyan-500"
            />
            {!user && (
              <button onClick={() => setIsAuthOpen(true)} className="text-xs bg-jild-gradient px-3 py-1.5 rounded-lg font-bold">
                Connexion
              </button>
            )}
          </div>
        </header>

        {/* BARRE DE STORIES */}
        <section className="flex gap-4 overflow-x-auto p-4 border-b border-slate-800/60 no-scrollbar">
          <div className="flex flex-col items-center gap-1 min-w-[68px] cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center text-cyan-400 text-2xl font-bold hover:border-cyan-400 transition">
              +
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Votre story</span>
          </div>

          {/* EXEMPLES DE STORIES AVIS / AMIS */}
          {['Alex', 'Sarah', 'Kofi', 'Awa'].map((name, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 min-w-[68px] cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-jild-gradient p-[2px]">
                <div className="w-full h-full bg-slate-900 rounded-full p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-200">
                    {name[0]}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium truncate w-16 text-center">{name}</span>
            </div>
          ))}
        </section>

        {/* FORMULAIRE DE PUBLICATION */}
        <section className="p-4 border-b border-slate-800/60 bg-slate-900/40 space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-jild-gradient p-[2px] flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-xs font-bold">
                {user ? (user.user_metadata?.username || user.email).charAt(0).toUpperCase() : '👤'}
              </div>
            </div>
            <textarea 
              placeholder={user ? `Quoi de neuf, ${user.user_metadata?.username || user.email.split('@')[0]} ?` : "Connecte-toi pour poster..."} 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              onClick={() => { if (!user) setIsAuthOpen(true) }} 
              rows="2" 
              className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder-slate-500 pt-2" 
            />
          </div>

          {imageFile && (
            <div className="relative mt-2">
              <img src={URL.createObjectURL(imageFile)} className="max-h-60 rounded-2xl object-cover w-full border border-slate-800" />
              <button onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 text-xs backdrop-blur-md">✕</button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-cyan-400 transition">
              📷 Photo 
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (!user) setIsAuthOpen(true); else setImageFile(e.target.files[0]) }} />
            </label>
            <button 
              onClick={handlePublish} 
              disabled={uploading} 
              className="bg-jild-gradient px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md shadow-purple-500/10 hover:opacity-90 transition"
            >
              {uploading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </section>

        {/* LISTE DES POSTS */}
        <section className="divide-y divide-slate-800/60">
          {filteredStories.map((story) => {
            const storyLikes = likes[story.id] || []
            const hasLiked = user && storyLikes.includes(user.id)
            const isFollowingAuthor = following.includes(story.user_id)

            return (
              <article key={story.id} className="p-4 space-y-3 hover:bg-slate-900/20 transition">
                <div className="flex justify-between items-center">
                  <Link href="/mon-profil" className="flex items-center gap-3 hover:opacity-80">
                    <div className="w-10 h-10 rounded-full bg-jild-gradient p-[2px]">
                      <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-bold text-xs text-purple-400">
                        {story.author ? story.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100 text-sm">{story.author}</p>
                      <p className="text-[10px] text-slate-500">{new Date(story.created_at).toLocaleDateString()}</p>
                    </div>
                  </Link>

                  {user && story.user_id && story.user_id !== user.id && (
                    <button
                      onClick={() => handleToggleFollow(story.user_id)}
                      className={`text-xs px-3 py-1 rounded-xl font-semibold transition ${
                        isFollowingAuthor
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-jild-gradient text-white'
                      }`}
                    >
                      {isFollowingAuthor ? 'Abonné' : '+ Suivre'}
                    </button>
                  )}
                </div>

                {story.content && <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{story.content}</p>}
                {story.image_url && <img src={story.image_url} className="w-full max-h-[450px] object-cover rounded-2xl border border-slate-800" />}

                {/* BOUTONS INTERACTIONS */}
                <div className="flex items-center gap-6 pt-1 text-xs text-slate-400 font-medium">
                  <button onClick={() => handleToggleLike(story.id)} className={`flex items-center gap-1.5 transition ${hasLiked ? 'text-pink-500 font-bold' : 'hover:text-white'}`}>
                    <span>{hasLiked ? '❤️' : '🤍'}</span> {storyLikes.length}
                  </button>
                  <span className="flex items-center gap-1.5">
                    💬 {(comments[story.id] || []).length}
                  </span>
                </div>

                {/* COMMENTAIRES */}
                <div className="pt-2 space-y-2">
                  {(comments[story.id] || []).map((c) => (
                    <div key={c.id} className="bg-slate-900/60 p-2.5 rounded-xl text-xs border border-slate-800/40">
                      <span className="font-bold text-cyan-400">{c.author_name} : </span>
                      <span className="text-slate-300">{c.content}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input 
                      type="text" 
                      placeholder="Laisser un commentaire..." 
                      value={newComment[story.id] || ''} 
                      onChange={(e) => setNewComment({ ...newComment, [story.id]: e.target.value })} 
                      className="flex-grow p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-purple-500" 
                    />
                    <button onClick={() => handleAddComment(story.id)} className="bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-cyan-400 font-bold hover:bg-slate-700">
                      Poster
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. PANNEAU DROIT (DESKTOP - SUGGESTIONS & RECHERCHE)
      ───────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:block w-80 p-6 sticky top-0 h-screen space-y-6">
        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl flex items-center gap-2">
          <span className="text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Rechercher sur JILD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white outline-none w-full"
          />
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggestions pour vous</h3>
          {['Marilyne', 'Kevin_228', 'Dounia_J'].map((sug, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                  {sug[0]}
                </div>
                <span className="text-xs font-medium text-slate-200">{sug}</span>
              </div>
              <button className="text-[11px] text-cyan-400 font-bold hover:underline">Suivre</button>
            </div>
          ))}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          4. BARRE DE NAVIGATION EN BAS (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#090d16]/95 border-t border-slate-800/80 py-3 px-6 z-40 backdrop-blur-md">
        <div className="flex justify-around items-center text-slate-400">
          <Link href="/" className="text-white">🏠</Link>
          <Link href="/messages">💬</Link>
          <button onClick={() => alert('Création rapide')} className="w-10 h-10 rounded-full bg-jild-gradient text-white flex items-center justify-center text-lg font-bold shadow-lg">
            +
          </button>
          <button onClick={() => alert('Notifications')}>🔔</button>
          <Link href="/mon-profil">👤</Link>
        </div>
      </nav>

      {/* MODALE AUTHENTIFICATION */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm relative shadow-2xl space-y-4">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-jild-gradient">{isSignUp ? 'Rejoindre JILD' : 'Bienvenue sur JILD'}</h2>
              <p className="text-xs text-slate-400">Connecte-toi pour interagir avec la communauté.</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-3">
              {isSignUp && <input type="text" placeholder="Pseudo" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500" required />}
              <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500" required />
              <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-500" required />
              <button type="submit" className="w-full bg-jild-gradient py-3 rounded-xl font-bold text-xs text-white shadow-lg shadow-purple-500/20">{isSignUp ? 'S\'inscrire' : 'Se connecter'}</button>
            </form>
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-cyan-400 text-center w-full block">
              {isSignUp ? 'Déjà un compte ? Connexion' : 'Pas de compte ? Créer un compte'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
              }
