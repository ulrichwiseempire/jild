import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Home, Search, Bell, Mail, Image, Send, User, Heart, MessageCircle, Repeat, Share } from 'lucide-react'

export default function Feed() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    fetchUserAndPosts()
  }, [])

  const fetchUserAndPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setCurrentUser(user)
    fetchPosts()
  }

  const fetchPosts = async () => {
    // Jointure entre la table posts et profiles pour récupérer les infos de l'auteur
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement posts:', error.message)
    } else {
      setPosts(data || [])
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!content.trim() && !imageFile) return

    setLoading(true)
    try {
      let uploadedImageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath)

        uploadedImageUrl = publicUrlData.publicUrl
      }

      const { error: insertError } = await supabase.from('posts').insert([
        {
          user_id: currentUser.id,
          content: content,
          image_url: uploadedImageUrl,
        },
      ])

      if (insertError) throw insertError

      setContent('')
      setImageFile(null)
      setImagePreview(null)
      fetchPosts() // Recharger le fil
    } catch (error) {
      alert('Erreur lors de la publication : ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      {/* En-tête */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-[#2F3336] z-10 flex justify-between items-center px-4 h-14">
        <h1 className="font-bold text-lg">Accueil</h1>
        <div className="w-8 h-8 rounded-full bg-[#202327] flex items-center justify-center text-xs font-bold">
          X
        </div>
      </header>

      {/* Zone de création de post */}
      <div className="p-4 border-b border-[#2F3336]">
        <form onSubmit={handleCreatePost}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf ?"
            className="w-full bg-transparent text-white placeholder-[#71767B] outline-none resize-none text-base"
            rows="3"
          />

          {imagePreview && (
            <div className="relative mb-3 rounded-2xl overflow-hidden border border-[#2F3336]">
              <img src={imagePreview} alt="Aperçu" className="w-full max-h-60 object-cover" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-[#2F3336]">
            <label className="cursor-pointer text-[#1D9BF0] hover:bg-white/10 p-2 rounded-full transition">
              <Image className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>

            <button
              type="submit"
              disabled={loading || (!content.trim() && !imageFile)}
              className="bg-[#1D9BF0] hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-full text-sm transition"
            >
              {loading ? 'Post...' : 'Poster'}
            </button>
          </div>
        </form>
      </div>

      {/* Fil de publications */}
      <div className="divide-y divide-[#2F3336]">
        {posts.map((post) => (
          <article key={post.id} className="p-4 hover:bg-white/[0.03] transition flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#202327] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#71767B]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-bold text-white truncate">
                  {post.profiles?.full_name || 'Utilisateur'}
                </span>
                <span className="text-[#71767B] truncate">
                  @{post.profiles?.username || 'anonyme'}
                </span>
              </div>

              {post.content && (
                <p className="mt-1 text-sm text-[#EFF3F4] whitespace-pre-line break-words">
                  {post.content}
                </p>
              )}

              {post.image_url && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-[#2F3336]">
                  <img src={post.image_url} alt="Contenu" className="w-full max-h-96 object-cover" />
                </div>
              )}

              <div className="flex justify-between text-[#71767B] mt-3 max-w-md text-xs">
                <button className="flex items-center gap-1 hover:text-[#1D9BF0]"><MessageCircle className="w-4 h-4" /></button>
                <button className="flex items-center gap-1 hover:text-green-500"><Repeat className="w-4 h-4" /></button>
                <button className="flex items-center gap-1 hover:text-pink-500"><Heart className="w-4 h-4" /></button>
                <button className="flex items-center gap-1 hover:text-[#1D9BF0]"><Share className="w-4 h-4" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Navigation basse */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-[#2F3336] max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 text-[#71767B]">
          <button className="text-white"><Home className="w-6 h-6" /></button>
          <button className="hover:text-white"><Search className="w-6 h-6" /></button>
          <button className="hover:text-white"><Bell className="w-6 h-6" /></button>
          <button className="hover:text-white"><Mail className="w-6 h-6" /></button>
          <button onClick={() => router.push('/profile')} className="hover:text-white"><User className="w-6 h-6" /></button>
        </div>
      </nav>
    </div>
  )
          }
    
