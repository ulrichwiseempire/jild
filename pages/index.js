import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Home, Search, Bell, Mail, Image, Film, Music, User, MessageCircle, Repeat, Heart, Share, Plus, X } from 'lucide-react'

export default function Feed() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [stories, setStories] = useState([])
  const [content, setContent] = useState('')

  const [visualFile, setVisualFile] = useState(null)
  const [visualType, setVisualType] = useState(null) // 'image' | 'video'
  const [visualPreview, setVisualPreview] = useState(null)

  const [audioFile, setAudioFile] = useState(null)
  const [audioName, setAudioName] = useState('')

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
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (username, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (!error) setPosts(data || [])
  }
  
  const fetchStories = async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('stories')
      .select(`*, profiles:user_id (username, full_name, avatar_url)`)
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false })
    setStories(data || [])
  }

  const handleVisualSelect = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      setVisualFile(file)
      setVisualType(type)
      setVisualPreview(URL.createObjectURL(file))
    }
  }

  const handleAudioSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAudioFile(file)
      setAudioName(file.name)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!content.trim() && !visualFile && !audioFile) return

    setLoading(true)
    try {
      let imageUrl = null
      let videoUrl = null
      let audioUrl = null

      // Upload Média Principal (Image/Vidéo)
      if (visualFile) {
        const fileExt = visualFile.name.split('.').pop()
        const filePath = `${currentUser.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('posts').upload(filePath, visualFile)
        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage.from('posts').getPublicUrl(filePath)
        if (visualType === 'image') imageUrl = publicData.publicUrl
        if (visualType === 'video') videoUrl = publicData.publicUrl
      }

      // Upload Audio
      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop()
        const filePath = `${currentUser.id}/audio_${Date.now()}.${fileExt}`
        const { error: uploadAudioError } = await supabase.storage.from('audio').upload(filePath, audioFile)
        if (uploadAudioError) throw uploadAudioError

        const { data: publicAudioData } = supabase.storage.from('audio').getPublicUrl(filePath)
        audioUrl = publicAudioData.publicUrl
      }

      // Insertion BDD
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        content: content,
        image_url: imageUrl,
        video_url: videoUrl,
        audio_url: audioUrl
      })

      if (insertError) throw insertError

      setContent('')
      setVisualFile(null)
      setVisualPreview(null)
      setAudioFile(null)
      setAudioName('')
      fetchPosts()
    } catch (error) {
      alert('Erreur lors du post : ' + error.message)
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
      const { error } = await supabase.storage.from('stories').upload(filePath, file)
      if (error) throw error

      const { data } = supabase.storage.from('stories').getPublicUrl(filePath)
      await supabase.from('stories').insert({
        user_id: currentUser.id,
        media_url: data.publicUrl,
        media_type: type
      })

      fetchStories()
    } catch (err) {
      alert('Erreur story : ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-[#2F3336] z-10 flex items-center justify-between px-4 h-14">
        <h1 className="font-bold text-lg">Accueil</h1>
        <span className="font-black text-xl text-[#1D9BF0]">JILD</span>
      </header>

      {/* Stories */}
      <div className="flex gap-3 p-3 overflow-x-auto border-b border-[#2F3336]">
        <label className="flex flex-col items-center flex-shrink-0 cursor-pointer">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#1D9BF0] flex items-center justify-center bg-[#16181C]">
            <Plus className="w-6 h-6 text-[#1D9BF0]" />
          </div>
          <span className="text-[10px] mt-1 text-[#71767B]">Ma story</span>
          <input type="file" accept="image/*,video/*" onChange={handleAddStory} className="hidden" />
        </label>

        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center flex-shrink-0">
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-[#1D9BF0]">
              <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
                {story.media_type === 'video' ? (
                  <video src={story.media_url} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={story.media_url} className="w-full h-full object-cover" />
                )}
              </div>
            </div>
            <span className="text-[10px] mt-1 text-[#71767B] truncate w-14 text-center">
              @{story.profiles?.username || 'user'}
            </span>
          </div>
        ))}
      </div>

      {/* Création de post */}
      <div className="p-4 border-b border-[#2F3336]">
        <form onSubmit={handleCreatePost}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf ?"
            className="w-full bg-transparent text-[#EFF3F4] placeholder-[#71767B] resize-none outline-none text-sm"
            rows="3"
          />

          {visualPreview && (
            <div className="relative mt-2 mb-3 rounded-xl overflow-hidden border border-[#2F3336]">
              {visualType === 'image' ? (
                <img src={visualPreview} className="w-full max-h-60 object-cover" />
              ) : (
                <video src={visualPreview} controls className="w-full max-h-60" />
              )}
              <button
                type="button"
                onClick={() => { setVisualFile(null); setVisualPreview(null); setVisualType(null); }}
                className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {audioName && (
            <div className="flex items-center justify-between bg-[#16181C] p-2 rounded-xl mb-3 border border-[#2F3336]">
              <span className="text-xs text-[#1D9BF0] truncate flex items-center gap-1">
                <Music className="w-3.5 h-3.5" /> {audioName}
              </span>
              <button type="button" onClick={() => { setAudioFile(null); setAudioName(''); }}>
                <X className="w-4 h-4 text-[#71767B]" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-[#2F3336]">
            <div className="flex gap-2 text-[#1D9BF0]">
              <label className="cursor-pointer hover:bg-white/10 p-2 rounded-full">
                <Image className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={(e) => handleVisualSelect(e, 'image')} className="hidden" />
              </label>
              <label className="cursor-pointer hover:bg-white/10 p-2 rounded-full">
                <Film className="w-5 h-5" />
                <input type="file" accept="video/*" onChange={(e) => handleVisualSelect(e, 'video')} className="hidden" />
              </label>
              <label className="cursor-pointer hover:bg-white/10 p-2 rounded-full">
                <Music className="w-5 h-5" />
                <input type="file" accept="audio/*" onChange={handleAudioSelect} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || (!content.trim() && !visualFile && !audioFile)}
              className="bg-[#1D9BF0] hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-full text-sm transition"
            >
              {loading ? '...' : 'Poster'}
            </button>
          </div>
        </form>
      </div>

      {/* Rendu des Posts */}
      <div className="divide-y divide-[#2F3336]">
        {posts.map((post) => (
          <article key={post.id} className="p-4 hover:bg-white/[0.02] flex gap-3">
            <div 
              onClick={() => router.push(`/user/${post.user_id}`)}
              className="w-10 h-10 rounded-full bg-[#202327] overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer"
            >
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-[#71767B]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div 
                onClick={() => router.push(`/user/${post.user_id}`)}
                className="flex items-center gap-1.5 text-sm cursor-pointer hover:underline"
              >
                <span className="font-bold text-white truncate">{post.profiles?.full_name || 'Utilisateur'}</span>
                <span className="text-[#71767B] truncate">@{post.profiles?.username || 'anonyme'}</span>
              </div>

              {post.content && <p className="mt-1 text-sm text-[#EFF3F4] whitespace-pre-line">{post.content}</p>}

              {post.image_url && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-[#2F3336]">
                  <img src={post.image_url} className="w-full max-h-96 object-cover" />
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
                    <Music className="w-3.5 h-3.5" /> Musique associée
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

      {/* Navbar du bas */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-[#2F3336] max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 text-[#71767B]">
          <button onClick={() => router.push('/')} className="text-white"><Home className="w-6 h-6" /></button>
          <button className="hover:text-white"><Search className="w-6 h-6" /></button>
          <button className="hover:text-white"><Bell className="w-6 h-6" /></button>
          <button className="hover:text-white"><Mail className="w-6 h-6" /></button>
          <button onClick={() => router.push('/profile')} className="hover:text-white"><User className="w-6 h-6" /></button>
        </div>
      </nav>
    </div>
  )
      }
        
