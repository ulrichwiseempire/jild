import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Heart, MessageCircle, Repeat, Bookmark, Share, Image, Film, Music } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Vérifier la session utilisateur
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
    fetchPosts()
  }, [])

  // 1. Charger tous les posts avec le profil de l'auteur (Nom + Pseudo)
  const fetchPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          full_name,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement posts:', error)
      return
    }

    // Vérifier les réactions de l'utilisateur connecté sur chaque post
    if (data && user) {
      const postsWithUserStates = await Promise.all(
        data.map(async (post) => {
          // Vérifier si liké
          const { data: likeData } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle()

          // Vérifier si repartagé
          const { data: repostData } = await supabase
            .from('reposts')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle()

          // Vérifier si enregistré (bookmark)
          const { data: bookmarkData } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle()

          return {
            ...post,
            user_has_liked: !!likeData,
            user_has_reposted: !!repostData,
            user_has_bookmarked: !!bookmarkData,
          }
        })
      )
      setPosts(postsWithUserStates)
    } else {
      setPosts(data || [])
    }
  }

  // 2. Créer un nouveau Post
  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Veuillez vous connecter pour publier.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('posts')
      .insert([{ user_id: user.id, content }])

    if (error) {
      alert('Erreur lors de la publication : ' + error.message)
    } else {
      setContent('')
      fetchPosts()
    }
    setLoading(false)
  }

  // 3. Gestion du Like (Ajouter / Enlever)
  const handleLike = async (postId) => {
    if (!user) return alert('Connectez-vous pour liker !')

    const currentPost = posts.find(p => p.id === postId)
    if (!currentPost) return

    if (currentPost.user_has_liked) {
      // Supprimer le Like
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
    } else {
      // Ajouter le Like
      await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: user.id }])
    }
    fetchPosts()
  }

  // 4. Gestion du Repartage
  const handleRepost = async (postId) => {
    if (!user) return alert('Connectez-vous pour repartager !')

    const currentPost = posts.find(p => p.id === postId)
    if (!currentPost) return

    if (currentPost.user_has_reposted) {
      await supabase
        .from('reposts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('reposts')
        .insert([{ post_id: postId, user_id: user.id }])
    }
    fetchPosts()
  }

  // 5. Gestion de la Sauvegarde / Enregistrer (Bookmark)
  const handleBookmark = async (postId) => {
    if (!user) return alert('Connectez-vous pour enregistrer ce post !')

    const currentPost = posts.find(p => p.id === postId)
    if (!currentPost) return

    if (currentPost.user_has_bookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('bookmarks')
        .insert([{ post_id: postId, user_id: user.id }])
    }
    fetchPosts()
  }

  // 6. Gestion du Partage Externe (WhatsApp, SMS, Copier le lien)
  const handleShareExternal = async (post) => {
    const shareData = {
      title: `Post de ${post.profiles?.full_name || 'un utilisateur'} sur JILD`,
      text: post.content || 'Regarde ce post sur JILD !',
      url: window.location.origin + `/post/${post.id}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Partage annulé')
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
      alert('Lien du post copié dans le presse-papier !')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-2xl mx-auto border-x border-gray-800">
      
      {/* En-tête Fixe */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800 sticky top-0 bg-black/80 backdrop-blur z-10">
        <h1 className="text-xl font-bold">Accueil</h1>
        <span className="text-xl font-black text-[#1D9BF0]">JILD</span>
      </div>

      {/* Formulaire de Publication */}
      <div className="p-4 border-b border-gray-800">
        <form onSubmit={handleCreatePost}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf ?"
            className="w-full bg-transparent text-white focus:outline-none resize-none text-base min-h-[80px]"
          />
          <div className="flex justify-between items-center pt-3 border-t border-gray-800/50">
            <div className="flex gap-4 text-[#1D9BF0]">
              <button type="button" className="hover:opacity-80"><Image className="w-5 h-5" /></button>
              <button type="button" className="hover:opacity-80"><Film className="w-5 h-5" /></button>
              <button type="button" className="hover:opacity-80"><Music className="w-5 h-5" /></button>
            </div>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-[#1D9BF0] text-white font-bold px-5 py-2 rounded-full hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {loading ? 'Envoi...' : 'Poster'}
            </button>
          </div>
        </form>
      </div>

      {/* Flux de Posts */}
      <div>
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-800 p-4 hover:bg-white/5 transition">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <img
                src={post.profiles?.avatar_url || 'https://via.placeholder.com/40'}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover bg-gray-700"
              />
              
              <div className="flex-1 min-w-0">
                {/* Information Utilisateur */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate">
                    {post.profiles?.full_name || 'Utilisateur'}
                  </span>
                  <span className="text-gray-500 text-sm truncate">
                    @{post.profiles?.username || 'user'}
                  </span>
                </div>

                {/* Contenu du Post */}
                <p className="text-white mt-1 whitespace-pre-line text-sm md:text-base">
                  {post.content}
                </p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Media post"
                    className="mt-3 rounded-2xl max-h-96 w-full object-cover border border-gray-800"
                  />
                )}

                {/* --- BARRE D'ACTIONS COMPLÈTE --- */}
                <div className="flex justify-between items-center text-[#71767B] mt-4 max-w-md text-sm">
                  
                  {/* 1. LIKE (Cœur Rouge) */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 hover:text-red-500 transition group"
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform group-active:scale-125 ${
                        post.user_has_liked
                          ? 'text-red-500 fill-red-500'
                          : 'group-hover:text-red-500'
                      }`}
                    />
                    <span className={post.user_has_liked ? 'text-red-500 font-semibold' : ''}>
                      {post.likes_count || 0}
                    </span>
                  </button>

                  {/* 2. COMMENTAIRES (Bulle) */}
                  <button
                    onClick={() => router.push(`/post/${post.id}`)}
                    className="flex items-center gap-1.5 hover:text-[#1D9BF0] transition"
                  >
                    <MessageCircle className="w-5 h-5 hover:text-[#1D9BF0]" />
                    <span>{post.comments_count || 0}</span>
                  </button>

                  {/* 3. REPARTAGE (Avec Coche verte) */}
                  <button
                    onClick={() => handleRepost(post.id)}
                    className="flex items-center gap-1.5 hover:text-green-500 transition"
                  >
                    <Repeat className={`w-5 h-5 ${post.user_has_reposted ? 'text-green-500' : ''}`} />
                    {post.user_has_reposted && (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 font-bold">
                        ✓
                      </span>
                    )}
                    <span className={post.user_has_reposted ? 'text-green-500 font-semibold' : ''}>
                      {post.reposts_count || 0}
                    </span>
                  </button>

                  {/* 4. ENREGISTRER (Signet Rempli en Blanc) */}
                  <button
                    onClick={() => handleBookmark(post.id)}
                    className="flex items-center gap-1.5 hover:text-white transition group"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${
                        post.user_has_bookmarked
                          ? 'text-white fill-white'
                          : 'group-hover:text-white'
                      }`}
                    />
                  </button>

                  {/* 5. PARTAGER (Avion / Partage Externe) */}
                  <button
                    onClick={() => handleShareExternal(post)}
                    className="flex items-center gap-1.5 hover:text-[#1D9BF0] transition"
                  >
                    <Share className="w-5 h-5 hover:text-[#1D9BF0]" />
                  </button>

                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
              }
        
