import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { ArrowLeft, Camera, Calendar, User, Home, Search, Bell, Mail } from 'lucide-react'

export default function Profile() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setFullName(data.full_name || '')
      setBio(data.bio || '')
      setAvatarUrl(data.avatar_url || '')
      setBannerUrl(data.banner_url || '')
    }
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
      getProfile()
    }
  }

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
      <div className="px-4 space-y-3">
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

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-[#2F3336] max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 text-[#71767B]">
          <button onClick={() => router.push('/')}><Home className="w-6 h-6" /></button>
          <button className="hover:text-white"><Search className="w-6 h-6" /></button>
          <button className="hover:text-white"><Bell className="w-6 h-6" /></button>
          <button className="hover:text-white"><Mail className="w-6 h-6" /></button>
          <button className="text-white"><User className="w-6 h-6" /></button>
        </div>
      </nav>
    </div>
  )
    }
        
