import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─────────────────────────────────────────────────────────────
// COMPOSANTS ICÔNES SVG (100% Vectoriels, Style Pro)
// ─────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
)

const MessageIcon = () => (
  <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.598.598 0 01-.744-.666l.243-1.462A8.995 8.995 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-5 h-5 stroke-slate-400 hover:stroke-red-400 transition fill-none" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H2.25" />
  </svg>
)

const HeartIcon = ({ filled }) => (
  <svg className={`w-5 h-5 transition-transform active:scale-125 ${filled ? 'fill-pink-500 stroke-pink-500' : 'stroke-slate-400 fill-none hover:stroke-white'}`} viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
)

const CommentIcon = () => (
  <svg className="w-5 h-5 stroke-slate-400 fill-none hover:stroke-white transition" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 007.5 20.25c1.42 0 2.747-.36 3.918-.99 1.171.63 2.498.99 3.918.99z" />
  </svg>
)

const RepostIcon = ({ active }) => (
  <svg className={`w-5 h-5 transition ${active ? 'stroke-green-400' : 'stroke-slate-400 hover:stroke-white'}`} viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
  </svg>
)

const ShareIcon = () => (
  <svg className="w-5 h-5 stroke-slate-400 fill-none hover:stroke-white transition" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
)

const BookmarkIcon = ({ active }) => (
  <svg className={`w-5 h-5 transition ${active ? 'fill-yellow-400 stroke-yellow-400' : 'stroke-slate-400 fill-none hover:stroke-white'}`} viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
  </svg>
)

const ImageIcon = () => (
  <svg className="w-5 h-5 stroke-slate-400 hover:stroke-cyan-400 fill-none transition" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
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
  const [bookmarks, setBookmarks] = useState({})
  const [reposts, setReposts] = useState({})
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
    fetchBookmarks()
    fetchReposts()

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

  const fetchBookmarks = async () => {
    const { data, error } = await supabase.from('bookmarks').select('*')
    if (!error && data) {
      const grouped = data.reduce((acc, b) => { acc[b.story_id] = acc[b.story_id] || []; acc[b.story_id].push(b.user_id); return acc }, {})
      setBookmarks(grouped)
    }
  }

  const fetchReposts = async () => {
    const { data, error } = await supabase.from('reposts').select('*')
    if (!error && data) {
      const grouped = data.reduce((acc, r) => { acc[r.story_id] = acc[r.story_id] || []; acc[r.story_id].push(r.user_id); return acc }, {})
      setReposts(grouped)
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

  const handleToggleBookmark = async (storyId) => {
    if (!user) return setIsAuthOpen(true)
    const isBookmarked = (bookmarks[storyId] || []).includes(user.id)
    if (isBookmarked) await supabase.from('bookmarks').delete().eq('story_id', storyId).eq('user_id', user.id)
    else await supabase.from('bookmarks').insert([{ story_id: storyId, user_id: user.id }])
    fetchBookmarks()
  }

  const handleToggleRepost = async (storyId) => {
    if (!user) return setIsAuthOpen(true)
    const hasReposted = (reposts[storyId] || []).includes(user.id)
    if (hasReposted) await supabase.from('reposts').delete().eq('story_id', storyId).eq('user_id', user.id)
    else await supabase.from('reposts').insert([{ story_id: storyId, user_id: user.id }])
    fetchReposts()
  }

  const handleShare = (storyId) => {
    if (navigator.share) {
      navigator.share({
        title: 'Regarde cette publication sur JILD',
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papier !')
    }
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

      {/* 1. MENU LATÉRAL FIXE (DESKTOP) */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 border-r border-slate-800/80 p-6 z-30 bg-[#090d16]">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-jild-gradient flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-purple-500/20">
              J
            </div>
            <span className="text-2xl font-black tracking-wider text-jild-gradient">JILD</span>
          </div>

          <nav className="space-y-2">
            <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-800/50 text-white font-semibold transition hover:bg-slate-800">
              <HomeIcon /> <span>Accueil</span>
            </Link>
            <button onClick={() => alert('Fonctionnalité Explorer à venir')} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition">
              <SearchIcon /> <span>Explorer</span>
            </button>
            <Link href="/messages" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition">
              <MessageIcon /> <span>Messages</span>
            </Link>
            <button onClick={() => alert('Aucune nouvelle notification')} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition">
              <BellIcon /> <span>Notifications</span>
            </button>
            <Link href="/mon-profil" className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition">
              <UserIcon /> <span>Mon Profil</span>
            </Link>
          </nav>
        </div>

        {/* SECTION UTILISATEUR & DECONNEXION */}
        <div className="border-t border-slate-800/80 pt-4">
          {user ? (
            <div className="flex items-center justify-between">
              <Link href="/mon-profil" className="flex items-center gap-3 hover:opacity-80 truncate">
                <div className="w-10 h-10 rounded-full bg-jild-gradient p-[2px] flex-shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center font-bold text-sm">
                    {user.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-white truncate">{user.user_metadata?.username || user.email.split('@')[0]}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                </div>
              </Link>
              
              {/* BOUTON DÉCONNEXION EN VRAIE ICÔNE SVG */}
              <button 
                onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                className="p-2 text-slate-400 hover:text-red-400 transition"
                title="Déconnexion"
              >
                <LogoutIcon />
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

      {/* 2. FLUX PRINCIPAL (FEED CENTRAL) */}
      <main className="w-full max-w-xl border-r border-slate-800/80 min-h-screen pb-24 md:pb-8">

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
              placeholder="Rechercher..."
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
                {user ? (user.user_metadata?.username || user.email).charAt(0).toUpperCase() : 'U'}
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
            <ImageIcon /> <span>Photo</span>
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
          const storyBookmarks = bookmarks[story.id] || []
          const storyReposts = reposts[story.id] || []
          
          const hasLiked = user && storyLikes.includes(user.id)
          const isBookmarked = user && storyBookmarks.includes(user.id)
          const hasReposted = user && storyReposts.includes(user.id)
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

              {/* BARRE D'ACTIONS */}
              <div className="flex items-center justify-between pt-3 text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-6">
                  <button onClick={() => handleToggleLike(story.id)} className="flex items-center gap-2 transition hover:opacity-80">
                    <HeartIcon filled={hasLiked} />
                    <span className={hasLiked ? 'text-pink-500 font-bold' : ''}>{storyLikes.length}</span>
                  </button>

                  <button className="flex items-center gap-2 transition hover:opacity-80">
                    <CommentIcon />
                    <span>{(comments[story.id] || []).length}</span>
                  </button>

                  <button onClick={() => handleToggleRepost(story.id)} className="flex items-center gap-2 transition hover:opacity-80">
                    <RepostIcon active={hasReposted} />
                    <span className={hasReposted ? 'text-green-400 font-bold' : ''}>{storyReposts.length}</span>
                  </button>

                  <button onClick={() => handleShare(story.id)} className="flex items-center gap-2 transition hover:opacity-80" title="Partager">
                    <ShareIcon />
                  </button>
                </div>

                <button onClick={() => handleToggleBookmark(story.id)} className="transition hover:opacity-80" title="Enregistrer">
                  <BookmarkIcon active={isBookmarked} />
                </button>
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

    {/* PANNEAU DROIT (DESKTOP) */}
    <aside className="hidden lg:block w-80 p-6 sticky top-0 h-screen space-y-6">
      <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl flex items-center gap-2 text-slate-400">
        <SearchIcon />
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

    {/* BARRE DE NAVIGATION MOBILE */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#090d16]/95 border-t border-slate-800/80 py-3 px-6 z-40 backdrop-blur-md">
      <div className="flex justify-around items-center text-slate-400">
        <Link href="/" className="text-white"><HomeIcon /></Link>
        <Link href="/messages"><MessageIcon /></Link>
        <button onClick={() => alert('Création rapide')} className="w-10 h-10 rounded-full bg-jild-gradient text-white flex items-center justify-center text-lg font-bold shadow-lg">
          +
        </button>
        <button onClick={() => alert('Notifications')}><BellIcon /></button>
        <Link href="/mon-profil"><UserIcon /></Link>
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
      )}

    </div>
  )
              }
          
