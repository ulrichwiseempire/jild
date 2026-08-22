import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { ArrowLeft, Camera, User, Home, Search, Bell, Mail, Film, Music, Heart } from 'lucide-react'

export default function Profile() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('posts') // 'posts' | 'videos' | 'musique' | 'likes'

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  useEffect(() => {
    getProfileAndPosts()
  }, [])

  const getProfileAndPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    // Récupérer le profil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setFullName(profileData.full_name || '')
      setBio(profileData.bio || '')
      setAvatarUrl(profileData.avatar_url || '')
      setBannerUrl(profileData.banner_url || '')
    }

    // Récupérer les posts de l'utilisateur
    const { data: postsData } = await supabase
      .from('posts')
      .select(`*, profiles:user_id (username, full_name, avatar_url)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setUserPosts(postsData || [])
    setLoading(false)
  }

  const handleUpload = async (e, bucket, setUrl) => {
    const file = e.target.files[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from(bucket).upload(filePath, file)
    if (error) {
      alert('Erreur upload : ' + error.message)
      return
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    setUrl(data.publicUrl)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      bio: bio,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      updated_at: new Date()
    }).eq('id', user.id)

    if (!error) {
      setEditing(false)
      getProfileAndPosts()
    }
  }

  // Filtrer les posts selon l'onglet actif
  const filteredPosts = userPosts.filter(post => {
    if (activeTab === 'videos') return post.video_url
    if (activeTab === 'musique') return post.audio_url
    return true // 'posts' affiche tout
  })

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Chargement...</div>

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      <header className="sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center gap-6 px-4 h-14 border-b border-[#2F3336]">
        <button onClick={() => router.push('/')}><ArrowLeft className="w-5 h-5 text-white" /></button>
        <div>
          <h1 className="font-bold text-lg leading-tight">{profile?.full_name || 'Profil'}</h1>
          <p className="text-xs text-[#71767B]">@{profile?.username}</p>
        </div>
      </header>

      {/* Bannière */}
      <div className="h-32 bg-[#202327] relative">
        {bannerUrl && <img src={bannerUrl} className="w-full h-full object-cover" />}
        {editing && (
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'posts', setBannerUrl)} className="hidden" />
          </label>
        )}
      </div>

      {/* Avatar & Action */}
      <div className="px-4 flex justify-between items-end -mt-12 mb-4 relative">
        <div className="w-24 h-24 rounded-full border-4 border-black bg-[#202327] overflow-hidden relative">
          {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-[#71767B] m-auto mt-4" />}
          {editing && (
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">
              <Camera className="w-5 h-5 text-white" />
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'avatars', setAvatarUrl)} className="hidden" />
            </label>
          )}
        </div>

        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className="border border-[#71767B] font-bold text-sm px-4 py-1.5 rounded-full hover:bg-white/10"
        >
          {editing ? 'Enregistrer' : 'Éditer le profil'}
        </button>
      </div>

      {/* Infos profil */}
      <div className="px-4 space-y-3 mb-4">
        {editing ? (
          <div className="space-y-3">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom" className="w-full bg-[#16181C] p-2 rounded-lg border border-[#2F3336] text-white" />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" className="w-full bg-[#16181C] p-2 rounded-lg border border-[#2F3336] text-white resize-none" rows="2" />
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-bold text-xl">{profile?.full_name}</h2>
              <p className="text-sm text-[#71767B]">@{profile?.username}</p>
            </div>
            {profile?.bio && <p className="text-sm">{profile.bio}</p>}
            <div className="flex gap-4 text-xs text-[#71767B]">
              <span><b className="text-white">0</b> Abonnements</span>
              <span><b className="text-white">0</b> Abonnés</span>
            </div>
          </>
        )}
      </div>

      {/* Onglets de profil */}
      <div className="flex border-b border-[#2F3336] text-sm font-bold text-[#71767B]">
        <button onClick={() => setActiveTab('posts')} className={`flex-1 py-3 text-center transition ${activeTab === 'posts' ? 'text-white border-b-2 border-[#1D9BF0]' : 'hover:bg-white/5'}`}>Posts</button>
        <button onClick={() => setActiveTab('videos')} className={`flex-1 py-3 text-center transition ${activeTab === 'videos' ? 'text-white border-b-2 border-[#1D9BF0]' : 'hover:bg-white/5'}`}>Vidéos</button>
        <button onClick={() => setActiveTab('musique')} className={`flex-1 py-3 text-center transition ${activeTab === 'musique' ? 'text-white border-b-2 border-[#1D9BF0]' : 'hover:bg-white/5'}`}>Musique</button>
        <button onClick={() => setActiveTab('likes')} className={`flex-1 py-3 text-center transition ${activeTab === 'likes' ? 'text-white border-b-2 border-[#1D9BF0]' : 'hover:bg-white/5'}`}>J'aime</button>
      </div>

      {/* Liste des posts filtrés */}
      <div className="divide-y divide-[#2F3336]">
        {filteredPosts.length === 0 ? (
          <p className="text-center text-[#71767B] py-10 text-sm">Aucun contenu dans cet onglet.</p>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="p-4 border-b border-[#2F3336]">
              <p className="text-sm mb-2">{post.content}</p>
              {post.image_url && <img src={post.image_url} className="rounded-xl max-h-60 w-full object-cover mb-2" />}
              {post.video_url && <video src={post.video_url} controls className="rounded-xl max-h-60 w-full mb-2" />}
              {post.audio_url && <audio src={post.audio_url} controls className="w-full h-8" />}
            </div>
          ))
        )}
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-[#2F3336] max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 text-[#71767B]">
          <button onClick={() => router.push('/')}><Home className="w-6 h-6" /></button>
          <button className="hover:text-white"><Search className="w-6 h-6" /></button>
          <button className="hover:text-white"><Bell className="w-6 h-6" /></button>
          <button className="hover:text-white"><Mail className="w-6 h-6" /></button>
          <button onClick={() => router.push('/profile')} className="text-white"><User className="w-6 h-6" /></button>
        </div>
      </nav>
    </div>
  )
            }
        
