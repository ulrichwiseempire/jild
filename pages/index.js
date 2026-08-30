import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Heart, MessageCircle, Repeat, Bookmark, Share, Image, Film, Music, Trash2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // 1. Vérification stricte de la connexion
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/login') // Redirige vers /login si l'utilisateur n'est pas connecté
      } else {
        setUser(currentUser)
        fetchPosts(currentUser.id)
      }
    }
    checkUser()
  }, [])

  // 2. Charger les posts et l'état des réactions
  const fetchPosts = async (currentUserId) => {
    const { data: rawPosts, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (
          full_name,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) return console.error('Erreur chargement posts:', error)

    // Charger les interactions de l'utilisateur connecté
    const [likesData, repostsData, bookmarksData] = await Promise.all([
      supabase.from('likes').select('post_id').eq('user_id', currentUserId),
      supabase.from('reposts').select('post_id').eq('user_id', currentUserId),
      supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId)
    ])

    const userLikes = new Set(likesData.data?.map(l => l.post_id))
    const userReposts = new Set(repostsData.data?.map(r => r.post_id))
    const userBookmarks = new Set(bookmarksData.data?.map(b => b.post_id))

    const formattedPosts = rawPosts.map(post => ({
      ...post,
      user_has_liked: userLikes.has(post.id),
      user_has_reposted: userReposts.has(post.id),
      user_has_bookmarked: userBookmarks.has(post.id)
    }))

    setPosts(formattedPosts)
  }

  // 3. Créer un Post
  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!content.trim() || !user) return
    setLoading(true)

    const { error } = await supabase
      .from('posts')
      .insert([{ user_id: user.id, content }])

    if (!error) {
      setContent('')
      fetchPosts(user.id)
    } else {
      alert('Erreur lors de la publication : ' + error.message)
    }
    setLoading(false)
  }

  // 4. Supprimer SON propre Post (Seul l'auteur voit le bouton et peut supprimer)
  const handleDeletePost = async (postId, authorId) => {
    if (user?.id !== authorId) return

    const confirmDelete = window.confirm('Veux-tu vraiment supprimer ce post ?')
    if (!confirmDelete) return

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id) // Double sécurité RLS Supabase

    if (error) {
      alert('Erreur lors de la suppression : ' + error.message)
    } else {
      fetchPosts(user.id) // Rafraîchir après suppression
    }
  }

  // 5. Gestion des Réactions (Like, Repost, Bookmark)
  const handleToggleInteraction = async (table, postId, currentState) => {
    if (!user) return
    if (currentState) {
      await supabase.from(table).delete().eq('post_id', postId).eq('user_id', user.id)
    } else {
      await supabase.from(table).insert([{ post_id: postId, user_id: user.id }])
    }
    fetchPosts(user.id)
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-gray-800 pb-16">
      
      {/* En-tête Fixe */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800 sticky top-0 bg-black/80 backdrop-blur z-10">
        <h1 className="text-xl font-bold">Accueil</h1>
        <span className="text-xl font-black text-[#1D9BF0]">JILD</span>
      </div>

      {/* Formulaire de Publication */}
      <div className="p-4 border-b border-gray-800 flex gap-4">
        <img 
          src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40'} 
          className="w-10 h-10 rounded-full bg-gray-800 object-cover" 
          alt="Avatar"
        />
        <form onSubmit={handleCreatePost} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf ?"
            className="w-full bg-transparent text-white focus:outline-none resize-none text-base min-h-[60px]"
          />
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-800/50">
            <div className="flex gap-4 text-[#1D9BF0]">
              <Image className="w-5 h-5 cursor-pointer hover:opacity-80" />
              <Film className="w-5 h-5 cursor-pointer hover:opacity-80" />
              <Music className="w-5 h-5 cursor-pointer hover:opacity-80" />
            </div>
            <button 
              type="submit" 
              disabled={loading || !content.trim()} 
              className="bg-[#1D9BF0] text-white font-bold px-5 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 transition text-sm"
            >
              {loading ? 'Envoi...' : 'Poster'}
            </button>
          </div>
        </form>
      </div>

      {/* Flux des Posts */}
      <div>
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-800 p-4 hover:bg-white/5 transition flex items-start gap-3">
            
            {/* Avatar Auteur */}
            <img 
              src={post.profiles?.avatar_url || 'https://via.placeholder.com/40'} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover bg-gray-800" 
            />
            
            <div className="flex-1 min-w-0">
              
              {/* Infos Auteur + Bouton Supprimer s'il est le proprio */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-white truncate">
                    {post.profiles?.full_name || 'Utilisateur'}
                  </span>
                  <span className="text-gray-500 text-sm truncate">
                    @{post.profiles?.username || 'user'}
                  </span>
                  <span className="text-gray-500 text-sm">·</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(post.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Bouton Poubelle (S'affiche uniquement si le post appartient à l'utilisateur connecté) */}
                {user?.id === post.user_id && (
                  <button 
                    onClick={() => handleDeletePost(post.id, post.user_id)}
                    className="text-gray-500 hover:text-red-500 p-1 transition"
                    title="Supprimer mon post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Contenu Texte & Image */}
              <p className="text-white mt-1.5 text-[15px] whitespace-pre-line leading-relaxed">
                {post.content}
              </p>
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="Post content" 
                  className="mt-3 rounded-2xl max-h-96 w-full object-cover border border-gray-800" 
                />
              )}

              {/* Barre d'Actions (Design X/Twitter Sombre) */}
              <div className="flex justify-between items-center text-[#71767B] mt-4 max-w-md text-sm pr-4">
                
                {/* 1. LIKE */}
                <button 
                  onClick={() => handleToggleInteraction('likes', post.id, post.user_has_liked)} 
                  className={`flex items-center gap-2 transition ${post.user_has_liked ? 'text-red-500' : 'hover:text-red-500'}`}
                >
                  <Heart className={`w-5 h-5 transition ${post.user_has_liked ? 'fill-red-500' : ''}`} />
                  <span className={post.user_has_liked ? 'font-semibold' : ''}>{post.likes_count || 0}</span>
                </button>

                {/* 2. COMMENTAIRES */}
                <button className="flex items-center gap-2 hover:text-[#1D9BF0] transition">
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.comments_count || 0}</span>
                </button>

                {/* 3. REPARTAGE */}
                <button 
                  onClick={() => handleToggleInteraction('reposts', post.id, post.user_has_reposted)} 
                  className={`flex items-center gap-2 transition ${post.user_has_reposted ? 'text-white' : 'hover:text-white'}`}
                >
                  <Repeat className="w-5 h-5" />
                  <span className={post.user_has_reposted ? 'font-semibold' : ''}>{post.reposts_count || 0}</span>
                </button>

                {/* 4. BOOKMARK (Signet) */}
                <button 
                  onClick={() => handleToggleInteraction('bookmarks', post.id, post.user_has_bookmarked)} 
                  className={`hover:text-white transition ${post.user_has_bookmarked ? 'text-white' : ''}`}
                >
                  <Bookmark className={`w-5 h-5 transition ${post.user_has_bookmarked ? 'fill-white' : ''}`} />
                </button>

                {/* 5. PARTAGE */}
                <button className="hover:text-[#1D9BF0] transition">
                  <Share className="w-5 h-5" />
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
      }
      
