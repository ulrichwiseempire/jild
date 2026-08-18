import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient' // Ajuste le chemin si ton client Supabase est ailleurs (ex: '../auth')

// --- ICÔNES SVG INLINE (Évite l'erreur lucide-react sur Vercel) ---
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

export default function HomeFeed() {
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Maintient la vraie session Supabase synchronisée
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const handlePublish = async () => {
    if (!content.trim() && !imageFile) return
    setUploading(true)
    
    // Ajout local rapide
    const newPost = {
      id: Date.now(),
      author: user?.user_metadata?.username || user?.email?.split('@')[0] || 'Anonyme',
      created_at: new Date().toISOString(),
      content,
      image_url: imageFile ? URL.createObjectURL(imageFile) : null
    }

    setPosts([newPost, ...posts])
    setContent('')
    setImageFile(null)
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F8FAFC] flex justify-center font-sans antialiased">
      <main className="w-full max-w-2xl border-x border-slate-800/60 pb-24 md:pb-10 min-h-screen">
        
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-[#0D1117]/80 backdrop-blur-md border-b border-slate-800/60 p-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]">
            JILD
          </h1>
          <div className="flex items-center gap-3">
            {!user ? (
              <Link href="/auth" className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-1.5 rounded-xl font-bold text-xs text-white">
                Connexion
              </Link>
            ) : (
              <Link href="/parametres" className="p-1.5 rounded-xl bg-[#161B22] text-[#94A3B8] border border-slate-800">
                <MenuIcon />
              </Link>
            )}
          </div>
        </header>

        {/* ZONE DE POST */}
        <section className="m-4 p-4 bg-[#161B22] border border-slate-800/80 rounded-2xl space-y-3">
          <textarea
            placeholder={user ? "Quoi de neuf ?" : "Connecte-toi pour publier..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="2"
            className="w-full bg-transparent text-[#F8FAFC] text-sm outline-none resize-none placeholder-[#94A3B8]"
          />
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#94A3B8]">
              <ImageIcon /> <span>Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
            </label>
            <button
              onClick={handlePublish}
              disabled={uploading}
              className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-5 py-2 rounded-xl font-bold text-xs text-white"
            >
              {uploading ? 'Envoi...' : 'Publier'}
            </button>
          </div>
        </section>

        {/* POSTS */}
        <section className="px-4 space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="p-4 bg-[#161B22] border border-slate-800/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-[#3B82F6]">
                  {post.author[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{post.author}</p>
                  <p className="text-[10px] text-[#94A3B8]">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {post.content && <p className="text-sm">{post.content}</p>}
              {post.image_url && <img src={post.image_url} className="w-full rounded-xl border border-slate-800" />}
              
              <div className="flex items-center justify-between pt-2 text-xs text-[#94A3B8]">
                <button className="flex items-center gap-1"><HeartIcon /> <span>0</span></button>
                <button className="flex items-center gap-1"><MessageIcon /> <span>0</span></button>
                <button className="flex items-center gap-1"><RepeatIcon /> <span>0</span></button>
                <button><ShareIcon /></button>
              </div>
            </article>
          ))}
        </section>
      </main>

      {/* BARRE DE NAVIGATION MOBILE (Rends la navigation fluide vers tes autres pages) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0D1117]/90 border-t border-slate-800 py-3 px-6 z-40 backdrop-blur-lg">
        <div className="flex justify-around items-center text-[#94A3B8]">
          <Link href="/" className="text-[#3B82F6]"><HomeIcon /></Link>
          <Link href="/messages"><MessageIcon /></Link>
          <Link href="/mon-profil"><UserIcon /></Link>
        </div>
      </nav>
    </div>
  )
  }
  
