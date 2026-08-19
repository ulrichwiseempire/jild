import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Home, Search, Bell, Mail, Plus, Heart, MessageCircle, Repeat, Bookmark, User } from 'lucide-react'

export default function Feed() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('forYou') // 'forYou' ou 'following'
  const [posts, setPosts] = useState([])
  const [newPostText, setNewPostText] = useState('')
  const [user, setUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
    fetchPosts()
  }, [activeTab])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
    } else {
      setUser(user)
    }
  }

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('*, profiles(username, full_name, avatar_url, is_verified)')
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (!error && data) {
      setPosts(data)
    }
    setLoading(false)
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!newPostText.trim() || !user) return

    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        content: newPostText,
      }
    ])

    if (!error) {
      setNewPostText('')
      setIsModalOpen(false)
      fetchPosts()
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      {/* En-tête supérieur avec onglets */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-[#2F3336] z-10">
        <div className="flex items-center justify-around h-14 font-bold text-sm">
          <button
            onClick={() => setActiveTab('forYou')}
            className={`h-full flex flex-col justify-center items-center relative ${
              activeTab === 'forYou' ? 'text-white' : 'text-[#71767B]'
            }`}
          >
            Pour vous
            {activeTab === 'forYou' && (
              <div className="absolute bottom-0 w-16 h-1 bg-[#1D9BF0] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`h-full flex flex-col justify-center items-center relative ${
              activeTab === 'following' ? 'text-white' : 'text-[#71767B]'
            }`}
          >
            Abonnements
            {activeTab === 'following' && (
              <div className="absolute bottom-0 w-24 h-1 bg-[#1D9BF0] rounded-full" />
            )}
          </button>
        </div>
      </header>

      {/* Liste des publications */}
      <main className="divide-y divide-[#2F3336]">
        {loading ? (
          <div className="p-8 text-center text-[#71767B] text-sm">Chargement du fil...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-[#71767B] text-sm">Aucune publication pour le moment.</div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="p-4 hover:bg-white/[0.02] transition">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#16181C] border border-[#2F3336] flex items-center justify-center font-bold text-sm shrink-0">
                  {post.profiles?.username?.[0]?.toUpperCase() || 'U'}
                </div>

                {/* Contenu */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-bold text-white">{post.profiles?.full_name || 'Utilisateur'}</span>
                    {post.profiles?.is_verified && (
                      <span className="text-[#1D9BF0] text-xs">✓</span>
                    )}
                    <span className="text-[#71767B]">@{post.profiles?.username || 'anonyme'}</span>
                  </div>

                  <p className="text-sm mt-1 text-[#EFF3F4] whitespace-pre-line">{post.content}</p>

                  {/* Boutons d'interaction */}
                  <div className="flex justify-between items-center text-[#71767B] mt-3 max-w-xs text-xs">
                    <button className="flex items-center gap-1 hover:text-[#1D9BF0]">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-green-500">
                      <Repeat className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-red-500">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="hover:text-[#1D9BF0]">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      {/* Bouton d'action flottant (+) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-[#1D9BF0] hover:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg transition"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Barre de navigation fixe en bas */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-[#2F3336] max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 text-[#71767B]">
          <button className="text-white"><Home className="w-6 h-6" /></button>
          <button className="hover:text-white"><Search className="w-6 h-6" /></button>
          <button className="hover:text-white"><Bell className="w-6 h-6" /></button>
          <button className="hover:text-white"><Mail className="w-6 h-6" /></button>
          <button onClick={() => router.push('/profil')} className="hover:text-white"><User className="w-6 h-6" /></button>
        </div>
      </nav>

      {/* Modal de publication */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-black border border-[#2F3336] rounded-2xl w-full max-w-md p-4">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setIsModalOpen(false)} className="text-sm text-[#71767B]">Annuler</button>
              <button
                onClick={handleCreatePost}
                className="bg-[#1D9BF0] font-bold px-4 py-1.5 rounded-full text-xs text-white"
              >
                Poster
              </button>
            </div>
            <textarea
              rows="4"
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Quoi de neuf ?"
              className="w-full bg-transparent text-white outline-none resize-none text-sm placeholder-[#71767B]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
  
