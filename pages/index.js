import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/router'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [user, setUser] = useState(null)
  const [stories, setStories] = useState([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    
    // Récupérer les posts
    fetchStories()
  }, [])

  async function fetchStories() {
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false })
    setStories(data || [])
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20">
      
      {/* HEADER FIXE */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tighter">JILD</h1>
        <button onClick={() => setIsSettingsOpen(true)} className="text-2xl">≡</button>
      </header>

      {/* FEED (LES POSTS) */}
      <main className="max-w-md mx-auto py-4 space-y-6">
        {stories.map((story) => (
          <article key={story.id} className="border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 p-2">
              <Link href={`/profile/${story.user_id}`} className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                {story.avatar_url && <img src={story.avatar_url} className="w-full h-full object-cover" />}
              </Link>
              <Link href={`/profile/${story.user_id}`} className="font-bold text-sm">{story.author}</Link>
            </div>
            {story.image_url && <img src={story.image_url} className="w-full h-80 object-cover rounded-lg" />}
            <p className="p-2 text-sm">{story.content}</p>
          </article>
        ))}
      </main>

      {/* BARRE DE NAVIGATION (BOTTOM) */}
      <nav className="fixed bottom-0 w-full bg-black border-t border-white/10 p-3 flex justify-around items-center">
        <Link href="/"><span className="text-2xl">🏠</span></Link>
        <button><span className="text-2xl">➕</span></button>
        <Link href="/messages"><span className="text-2xl">💬</span></Link>
        
        {/* LIEN VERS LE PROFIL (FIXE) */}
        <Link href={user ? `/profile/${user.id}` : '#'} className="w-7 h-7 rounded-full overflow-hidden border border-white">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-sky-600 flex items-center justify-center text-[10px] font-bold">
              {user ? (user.user_metadata?.username || user.email).charAt(0).toUpperCase() : '👤'}
            </div>
          )}
        </Link>
      </nav>

      {/* VOLET PARAMÈTRES (FIXE - PADDING RÉGLÉ) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex justify-end">
          <div className="bg-slate-900 w-full max-w-sm h-full p-5 pb-20 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Paramètres</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-xl">✕</button>
              </div>
              <div className="space-y-4">
                <p>👤 Modifier le profil</p>
                <p className="opacity-50">📊 Votre activité</p>
                <p className="opacity-50">🔔 Notifications</p>
              </div>
            </div>
            
            <button 
              onClick={async () => { await supabase.auth.signOut(); setIsSettingsOpen(false); router.reload(); }}
              className="w-full text-left py-3 text-red-500 font-bold border-t border-white/10 pt-4"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

        
