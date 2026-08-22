import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import { ArrowLeft, User, Home, Search, Bell, Mail } from 'lucide-react'

export default function UserProfile() {
  const router = useRouter()
  const { id } = router.query
  const [profile, setProfile] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    if (id) fetchUserData()
  }, [id])

  const fetchUserData = async () => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileData) setProfile(profileData)

    const { data: postsData } = await supabase
      .from('posts')
      .select(`*, profiles:user_id (username, full_name, avatar_url)`)
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    setUserPosts(postsData || [])
    setLoading(false)
  }

  const filteredPosts = userPosts.filter(post => {
    if (activeTab === 'videos') return post.video_url
    if (activeTab === 'musique') return post.audio_url
    return true
  })

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Chargement...</div>

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      <header className="sticky top-0 bg-black/80 backdrop-blur-md z-10 flex items-center gap-6 px-4 h-14 border-b border-[#2F3336]">
        <button onClick={() => router.back()}><ArrowLeft className="w-5 h-5 text-white" /></button>
        <div>
          <h1 className="font-bold text-lg leading-tight">{profile?.full_name || 'Profil'}</h1>
          <p className="text-xs text-[#71767B]">@{profile?.username}</p>
        </div>
      </header>

      <div className="h-32 bg-[#202327] relative">
        {profile?.banner_url && <img src={profile.banner_url} className="w-full h-full object-cover" />}
      </div>

      <div className="px-4 flex justify-between items-end -mt-12 mb-4 relative">
        <div className="w-24 h-24 rounded-full border-4 border-black bg-[#202327] overflow-hidden">
          {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-[#71767B] m-auto mt-4" />}
        </div>
        <button className="bg-white text-black font-bold text-sm px-5 py-1.5 rounded-full hover:bg-gray-200">
          S'abonner
        </button>
      </div>

      <div className="px-4 space-y-3 mb-4">
        <div>
          <h2 className="font-bold text-xl">{profile?.full_name}</h2>
          <p className="text-sm text-[#71767B]">@{profile?.username}</p>
        </div>
        {profile?.bio && <p className="text-sm">{profile.bio}</p>}
        <div className="flex gap-4 text-xs text-[#71767B]">
          <span><b className="text-white">0</b> Abonnements</span>
          <span><b className="text-white">0</b> Abonnés</span>
        </div>
      </div>

      <div className="flex border-b border-[#2F3336] text-sm font-bold text-[#71767B]">
        <button onClick={() => setActiveTab('posts')} className={`flex-1 py-3 text-center transition ${activeTab === 'posts' ? 'text-white border-b-2 border-[#1D9BF0]' : 'hover:bg-white/5'}`}>Posts</button>
        <button onClick={() => setActiveTab('videos')} className={`flex-1 py-3 text-center transition ${activeTab === 'videos' ? 'text-white border-b-2 border-[#1D9BF0]' : 'hover:bg-white/5'}`}>Vidéos</button>
        <button onClick={() => setActiveTab('musique')} className={`flex-1 py-3 text-center transition ${activeTab === 'musique' ? 'text-white border-b-2 border-[#1D9BF0]' : 'hover:bg-white/5'}`}>Musique</button>
      </div>

      <div className="divide-y divide-[#2F3336]">
        {filteredPosts.length === 0 ? (
          <p className="text-center text-[#71767B] py-10 text-sm">Aucun contenu.</p>
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

      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-[#2F3336] max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 text-[#71767B]">
          <button onClick={() => router.push('/')}><Home className="w-6 h-6" /></button>
          <button className="hover:text-white"><Search className="w-6 h-6" /></button>
          <button className="hover:text-white"><Bell className="w-6 h-6" /></button>
          <button className="hover:text-white"><Mail className="w-6 h-6" /></button>
          <button onClick={() => router.push('/profile')} className="hover:text-white"><User className="w-6 h-6" /></button>
        </div>
      </nav>
    </div>
  )
    }
    
