import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

// Initialisation de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- COMPOSANTS ICÔNES SVG NATIFS (Sans dépendances NPM) ---
const HeartIcon = ({ className, fill }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
)
const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
)
const RepeatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
)
const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
)
const BookmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
)
const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
)
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
)
const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
)
const BellIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
)
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
)
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
)

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Publication
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [newComment, setNewComment] = useState({})

  // 1. Maintien persistant de la session Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    fetchStories()

    return () => subscription.unsubscribe()
  }, [])

  // 2. Charger les posts Supabase
  const fetchStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else {
      setStories(data || [])
      if (data) {
        data.forEach(story => {
          fetchComments(story.id)
          fetchLikes(story.id)
        })
      }
    }
  }

  const fetchComments = async (storyId) => {
    const { data } = await supabase.from('comments').select('*').eq('story_id', storyId)
    setComments(prev => ({ ...prev, [storyId]: data || [] }))
  }

  const fetchLikes = async (storyId) => {
    const { data } = await supabase.from('likes').select('user_id').eq('story_id', storyId)
    setLikes(prev => ({ ...prev, [storyId]: data?.map(l => l.user_id) || [] }))
  }

  // 3. Authentification
  const handleAuth = async (e) => {
    e.preventDefault()
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      })
      if (error) alert(error.message)
      else setIsAuthOpen(false)
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) alert(error.message)
      else setIsAuthOpen(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsMenuOpen(false)
  }

  // 4. Publier une story / post
  const handlePublish = async () => {
    if (!user) return setIsAuthOpen(true)
    if (!content.trim() && !imageFile) return

    setUploading(true)
    let imageUrl = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('stories_images').upload(fileName, imageFile)

      if (uploadError) {
        alert(uploadError.message)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('stories_images').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    const { error } = await supabase.from('stories').insert([{
      user_id: user.id,
      author: user.user_metadata?.username || user.email.split('@')[0],
      content,
      image_url: imageUrl
    }])

    if (error) alert(error.message)
    else {
      setContent('')
      setImageFile(null)
      fetchStories()
    }
    setUploading(false)
  }

  // 5. Likes & Commentaires
  const handleToggleLike = async (storyId) => {
    if (!user) return setIsAuthOpen(true)
    const currentLikes = likes[storyId] || []
    const hasLiked = currentLikes.includes(user.id)

    if (hasLiked) {
      await supabase.from('likes').delete().eq('story_id', storyId).eq('user_id', user.id)
    } else {
      await supabase.from('likes').insert([{ story_id: storyId, user_id: user.id }])
    }
    fetchLikes(storyId)
  }

  const handleAddComment = async (storyId) => {
    if (!user) return setIsAuthOpen(true)
    const text = newComment[storyId]
    if (!text?.trim()) return

    await supabase.from('comments').insert([{
      story_id: storyId,
      user_id: user.id,
      author_name: user.user_metadata?.username || user.email.split('@')[0],
      content: text
    }])

    setNewComment({ ...newComment, [storyId]: '' })
    fetchComments(storyId)
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F8FAFC] flex justify-center font-sans antialiased">
      <main className="w-full max-w-2xl border-x border-slate-800/60 pb-24 md:pb-10 min-h-screen">
        
        {/* EN-TÊTE DU SITE */}
        <header className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-md border-b border-slate-800/60 p-4 flex justify-between items-center">
          <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
            JILD
          </h1>
          
          <div className="flex items-center gap-3">
            {!user ? (
              <button 
                onClick={() => setIsAuthOpen(true)}
                className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:opacity-90 px-4 py-1.5 rounded-xl font-bold text-xs text-white shadow-md shadow-purple-500/10 transition"
              >
                Connexion
              </button>
            ) : (
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 rounded-xl bg-[#161B22] text-[#94A3B8] border border-slate-800 hover:text-white transition"
              >
                <MenuIcon />
              </button>
            )}
          </div>
        </header>

        {/* MENU DÉROULANT RAPIDE */}
        {isMenuOpen && user && (
          <div className="bg-[#161B22] border-b border-slate-800 p-4 space-y-3">
            <p className="text-xs text-[#94A3B8]">Connecté en tant que <span className="text-white font-bold">{user.user_metadata?.username || user.email}</span></p>
            <div className="flex gap-4 text-xs font-semibold">
              <Link href="/mon-profil" className="text-[#3B82F6]">Mon profil</Link>
              <Link href="/parametres" className="text-[#94A3B8]">Paramètres</Link>
              <button onClick={handleLogout} className="text-red-400">Déconnexion</button>
            </div>
          </div>
        )}

        {/* BARRE DE STORIES */}
        <section className="p-4 border-b border-slate-800/60 overflow-x-auto flex gap-4 bg-[#161B22]/40 backdrop-blur-md">
          <div className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-[#161B22] border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400 hover:border-[#3B82F6] hover:text-[#3B82F6] transition">
              <span className="text-xl font-bold">+</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-medium">Votre story</span>
          </div>

          {['Alex', 'Sarah', 'Kofi', 'Awa'].map((name, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer group">
              <div className="w-14 h-14 rounded-full p-[2px] bg-slate-700 group-hover:bg-[#3B82F6] transition-all">
                <div className="w-full h-full bg-[#161B22] rounded-full flex items-center justify-center font-bold text-xs text-[#F8FAFC]">
                  {name[0]}
                </div>
              </div>
              <span className="text-[10px] text-[#94A3B8] font-medium">{name}</span>
            </div>
          ))}
        </section>

        {/* BLOC DE PUBLICATION */}
        <section className="m-4 p-4 bg-[#161B22] border border-slate-800/80 rounded-2xl shadow-lg space-y-3">
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-[#3B82F6] border border-slate-700">
              {user ? (user.user_metadata?.username || user.email)[0].toUpperCase() : 'U'}
            </div>
            <textarea
              placeholder={user ? `Quoi de neuf, ${user.user_metadata?.username || user.email.split('@')[0]} ?` : "Connecte-toi pour poster..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onClick={() => { if (!user) setIsAuthOpen(true) }}
              rows="2"
              className="w-full bg-transparent text-[#F8FAFC] text-sm outline-none resize-none placeholder-[#94A3B8] pt-2"
            />
          </div>

          {imageFile && (
            <div className="relative mt-2">
              <img src={URL.createObjectURL(imageFile)} className="max-h-60 rounded-xl object-cover w-full border border-slate-800" />
              <button onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 backdrop-blur-md">
                <CloseIcon />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#94A3B8] hover:text-[#3B82F6] transition">
              <ImageIcon /> <span>Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (!user) setIsAuthOpen(true); else setImageFile(e.target.files[0]) }} />
            </label>
            <button
              onClick={handlePublish}
              disabled={uploading}
              className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md shadow-purple-500/10 hover:opacity-90 transition"
            >
              {uploading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </section>

        {/* LISTE DES POSTS SUPABASE */}
        <section className="px-4 space-y-4">
          {stories.length === 0 ? (
            <p className="text-center text-xs text-[#94A3B8] py-8">Aucun message disponible. Sois le premier à publier !</p>
          ) : (
            stories.map((story) => {
              const storyLikes = likes[story.id] || []
              const storyComments = comments[story.id] || []
              const hasLiked = user && storyLikes.includes(user.id)

              return (
                <article key={story.id} className="p-4 bg-[#161B22] border border-slate-800/80 rounded-2xl shadow-lg space-y-3 hover:border-slate-700/80 transition">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-[#3B82F6] border border-slate-700">
                        {story.author ? story.author.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <Link href={`/profil/${story.author}`} className="font-semibold text-[#F8FAFC] text-sm hover:underline">
                          {story.author}
                        </Link>
                        <p className="text-[10px] text-[#94A3B8]">{new Date(story.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {story.content && <p className="text-[#F8FAFC] text-sm leading-relaxed whitespace-pre-line">{story.content}</p>}
                  {story.image_url && <img src={story.image_url} className="w-full max-h-[450px] object-cover rounded-xl border border-slate-800" />}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-[#94A3B8] font-medium">
                    <div className="flex items-center gap-6">
                      <button onClick={() => handleToggleLike(story.id)} className="flex items-center gap-1.5 transition hover:text-pink-500">
                        <HeartIcon className={hasLiked ? "fill-pink-500 text-pink-500" : ""} fill={hasLiked ? "#ec4899" : "none"} />
                        <span className={hasLiked ? 'text-pink-500 font-bold' : ''}>{storyLikes.length}</span>
                      </button>

                      <button className="flex items-center gap-1.5 transition hover:text-[#3B82F6]">
                        <MessageIcon />
                        <span>{storyComments.length}</span>
                      </button>

                      <button className="flex items-center gap-1.5 transition hover:text-green-400">
                        <RepeatIcon />
                        <span>0</span>
                      </button>

                      <button className="flex items-center gap-1.5 transition hover:text-[#3B82F6]">
                        <ShareIcon />
                      </button>
                    </div>

                    <button className="transition hover:text-[#3B82F6]">
                      <BookmarkIcon />
                    </button>
                  </div>

                  {/* Section Commentaires */}
                  <div className="pt-2 space-y-2">
                    {storyComments.map((c) => (
                      <div key={c.id} className="bg-[#0D1117] p-2.5 rounded-xl text-xs border border-slate-800/60">
                        <span className="font-bold text-[#3B82F6]">{c.author_name} : </span>
                        <span className="text-[#F8FAFC]">{c.content}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Ajouter un commentaire..."
                        value={newComment[story.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [story.id]: e.target.value })}
                        className="flex-grow p-2.5 bg-[#0D1117] border border-slate-800 rounded-xl text-xs text-[#F8FAFC] outline-none focus:border-[#3B82F6]"
                      />
                      <button onClick={() => handleAddComment(story.id)} className="bg-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-[#3B82F6] font-bold hover:bg-slate-700 transition">
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

      {/* PANNEAU DROIT (DESKTOP) */}
      <aside className="hidden lg:block w-80 p-6 sticky top-0 h-screen space-y-6">
        <div className="bg-[#161B22]/60 backdrop-blur-md border border-slate-800 p-3 rounded-2xl flex items-center gap-2 text-[#94A3B8]">
          <SearchIcon />
          <input
            type="text"
            placeholder="Rechercher sur JILD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-[#F8FAFC] outline-none w-full placeholder-[#94A3B8]"
          />
        </div>
      </aside>

            {/* BARRE DE NAVIGATION MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D1117]/80 border-t border-slate-800/80 py-2.5 px-6 z-40 backdrop-blur-lg">
        <div className="flex justify-around items-center text-[#94A3B8]">
          <Link href="/" className="text-[#F8FAFC]"><HomeIcon /></Link>
          <Link href="/messages"><MessageIcon /></Link>
          
          <button onClick={() => { if (!user) setIsAuthOpen(true); else alert('Utilise le formulaire en haut pour publier'); }} className="w-9 h-9 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white flex items-center justify-center text-lg font-bold shadow-md shadow-purple-500/20 active:scale-95 transition">
            +
          </button>

          <button onClick={() => alert('Notifications')}><BellIcon /></button>
          <Link href="/mon-profil"><UserIcon /></Link>
        </div>
      </nav>

      {/* MODALE AUTHENTIFICATION */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#161B22] border border-slate-800 p-6 rounded-3xl w-full max-w-sm relative shadow-2xl space-y-4">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-[#94A3B8] hover:text-white">
              <CloseIcon />
            </button>
            
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
                {isSignUp ? 'Rejoindre JILD' : 'Bienvenue sur JILD'}
              </h2>
              <p className="text-xs text-[#94A3B8]">Connecte-toi pour interagir avec la communauté.</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-3">
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Pseudo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-[#0D1117] border border-slate-800 rounded-xl text-xs text-[#F8FAFC] outline-none focus:border-[#3B82F6]"
                  required
                />
              )}
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#0D1117] border border-slate-800 rounded-xl text-xs text-[#F8FAFC] outline-none focus:border-[#3B82F6]"
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#0D1117] border border-slate-800 rounded-xl text-xs text-[#F8FAFC] outline-none focus:border-[#3B82F6]"
                required
              />
              <button type="submit" className="w-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] py-3 rounded-xl font-bold text-xs text-white shadow-lg shadow-purple-500/20 hover:opacity-90 transition">
                {isSignUp ? 'S\'inscrire' : 'Se connecter'}
              </button>
            </form>

            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-[#3B82F6] text-center w-full block hover:underline">
              {isSignUp ? 'Déjà un compte ? Connexion' : 'Pas de compte ? Créer un compte'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
        }
        
