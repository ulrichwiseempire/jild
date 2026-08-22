import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Home, Search, Bell, Mail, Image, Film, Music, User, Heart, MessageCircle, Repeat, Share, Plus, X } from 'lucide-react'

export default function Feed() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [stories, setStories] = useState([])
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'image' | 'video' | 'audio'
  const [mediaPreview, setMediaPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    initFeed()
  }, [])

  const initFeed = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setCurrentUser(user)
    fetchPosts()
    fetchStories()
  }

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
    setPosts(data || [])
  }

  const fetchStories = async () => {
    // Récupère uniquement les stories de moins de 24 heures
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('stories')
      .select(`
        *,
        profiles:user_id (username, avatar_url)
      `)
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false })
    setStories(data || [])
  }

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      setMediaFile(file)
      setMediaType(type)
      setMediaPreview(URL.createObjectURL(file))
    }
  }

  const clearMedia = () => {
    setMediaFile(null)
    setMediaType(null)
    setMediaPreview(null)
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!content.trim() && !mediaFile) return

    setLoading(true)
    try {
      let imageUrl = null, videoUrl = null, audioUrl = null

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop()
        const bucket = mediaType === 'audio' ? 'audio' : 'posts'
        const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, mediaFile)
        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
        const url = publicUrlData.publicUrl

        if (mediaType === 'image') imageUrl = url
        if (mediaType === 'video') videoUrl = url
        if (mediaType === 'audio') audioUrl = url
      }

      await supabase.from('posts').insert([{
        user_id: currentUser.id,
        content,
        image_url: imageUrl,
        video_url: videoUrl,
        audio_url: audioUrl,
      }])

      setContent('')
      clearMedia()
      fetchPosts()
    } catch (error) {
      alert('Erreur publication : ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStory = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const type = file.type.startsWith('video') ? 'video' : 'image'
    const fileExt = file.name.split('.').pop()
    const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage.from('stories').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('stories').getPublicUrl(filePath)

      await supabase.from('stories').insert([{
        user_id: currentUser.id,
        media_url: publicUrlData.publicUrl,
        media_type: type
      }])

      fetchStories()
    } catch (error) {
      alert('Erreur Story : ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      {/* En-tête JILD */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-[#2F3336] z-10 flex items-center justify-between px-4 h-14">
        <h1 className="font-bold text-lg">Accueil</h1>
        <span className="font-black text-xl text-[#1D9BF0] tracking-wider">JILD</span>
      </header>

      {/* Barre de Stories JILD */}
      <div className="flex gap-3 p-3 overflow-x-auto border-b border-[#2F3336] no-scrollbar">
        {/* Ajouter une Story */}
        <label className="flex flex-col items-center flex-shrink-0 cursor-pointer">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#1D9BF0] flex items-center justify-center bg-[#16181C]">
            <Plus className="w-6 h-6 text-[#1D9BF0]" />
          </div>
          <span className="text-[10px] mt-1 text-[#71767B]">Ma story</span>
          <input type="file" accept="image/*,video/*" onChange={handleAddStory} className="hidden" />
        </label>

        {/* Liste des Stories */}
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center flex-shrink-0 cursor-pointer">
            <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-[#1D9BF0]">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-[#202327]">
                <img src={story.profiles?.avatar_url || story.media_url} alt="Story" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-[10px] mt-1 text-[#71767B] truncate w-14 text-center">
              @{story.profiles?.username || 'anonyme'}
            </span>
          </div>
        ))}
      </div>

      {/* Zone de Création de Post */}
      <div className="p-4 border-b border-[#2F3336]">
        <form onSubmit={handleCreatePost}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf sur JILD ?"
            className="w-full bg-transparent text-white placeholder-[#71767B] outline-none resize-none text-base"
            rows="3"
          />

          {mediaPreview && (
            <div className="relative mb-3 rounded-2xl overflow-hidden border border-[#2F3336] bg-[#16181C] p-2">
              <button type="button" onClick={clearMedia} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 z-10">
                <X className="w-4 h-4" />
              </button>
              {mediaType === 'image' && <img src={mediaPreview} alt="Aperçu" className="w-full max-h-60 object-cover rounded-xl" />}
              {mediaType === 'video' && <video src={mediaPreview} controls className="w-full max-h-60 rounded-xl" />}
              {mediaType === 'audio' && <audio src={mediaPreview} controls className="w-full mt-4" />}
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-[#2F3336]">
            <div className="flex gap-1 text-[#1D9BF0]">
              <label className="cursor-pointer hover:bg-white/10 p-2 rounded-full transition">
                <Image className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
              </label>

              <label className="cursor-pointer hover:bg-white/10 p-2 rounded-full transition">
                <Film className="w-5 h-5" />
                <input type="file" accept="video/*" onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />
              </label>

              <label className="cursor-pointer hover:bg-white/10 p-2 rounded-full transition">
                <Music className="w-5 h-5" />
                <input type="file" accept="audio/*" onChange={(e) => handleFileSelect(e, 'audio')} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || (!content.trim() && !mediaFile)}
              className="bg-[#1D9BF0] hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-full text-sm transition"
            >
              {loading ? '...' : 'Poster'}
            </button>
          </div>
        </form>
      </div>

      {/* Fil de Posts */}
      <div className="divide-y divide-[#2F3336]">
        {posts.map((post) => (
          <article key={post.id} className="p-4 hover:bg-white/[0.02] transition flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#202327] overflow-hidden flex-shrink-0 flex items-center justify-center">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#71767B]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-bold text-white truncate">{post.profiles?.full_name || 'Utilisateur'}</span>
                <span className="text-[#71767B] truncate">@{post.profiles?.username || 'anonyme'}</span>
              </div>

              {post.content && <p className="mt-1 text-sm text-[#EFF3F4] whitespace-pre-line">{post.content}</p>}

              {post.image_url && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-[#2F3336]">
                  <img src={post.image_url} alt="Contenu" className="w-full max-h-96 object-cover" />
                </div>
              )}

              {post.video_url && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-[#2F3336]">
                  <video src={post.video_url} controls className="w-full max-h-96" />
                </div>
              )}

              {post.audio_url && (
                <div className="mt-3 p-3 bg-[#16181C] rounded-2xl border border-[#2F3336]">
                  <p className="text-xs text-[#1D9BF0] font-bold mb-1 flex items-center gap-1">
                    <Music className="w-3.5 h-3.5" /> Extrait Musique
                  </p>
                  <audio src={post.audio_url} controls className="w-full h-8" />
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

      {/* Navigation */}
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
    
