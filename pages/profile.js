import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Home, Search, Bell, Mail, ArrowLeft, Camera } from 'lucide-react'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth')
      return
    }

    setUser(user)

    // Récupérer le profil
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // Si le profil n'existe pas encore dans la table, on le crée
    if (!data) {
      const defaultProfile = {
        id: user.id,
        full_name: 'Ulrichwiseboy',
        username: 'ulrichwiseboy',
        bio: 'L\'IA et l\'automation au service du style. Créateur de l\'écosystème WiseEmpire.',
      }
      await supabase.from('profiles').insert([defaultProfile])
      setProfile(defaultProfile)
    } else {
      setProfile(data)
    }

    setLoading(false)
  }

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}-${Math.random()}.${fileExt}`

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatarUrl = publicUrlData.publicUrl

      await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: avatarUrl, updated_at: new Date() })

      setProfile({ ...profile, avatar_url: avatarUrl })
      alert('Photo de profil mise à jour !')
    } catch (error) {
      alert('Erreur : ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-[#2F3336] z-10 flex items-center gap-6 px-4 h-14">
        <button onClick={() => router.push('/')} className="hover:bg-white/10 p-2 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-base leading-tight">
            {profile?.full_name || 'Profil'}
          </h1>
          <p className="text-xs text-[#71767B]">@{profile?.username || 'anonyme'}</p>
        </div>
      </header>

      {loading ? (
        <div className="p-8 text-center text-[#71767B] text-sm">Chargement...</div>
      ) : (
        <div>
          <div className="h-32 bg-[#202327]"></div>

          <div className="px-4 relative flex justify-between items-end -mt-12 mb-4">
            <div className="relative group w-24 h-24 rounded-full border-4 border-black bg-[#16181C] overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{profile?.username?.[0]?.toUpperCase() || 'U'}</span>
              )}

              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Camera className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
              </label>
            </div>
          </div>

          <div className="px-4">
            <h2 className="font-bold text-xl">{profile?.full_name}</h2>
            <p className="text-[#71767B] text-sm">@{profile?.username}</p>
            <p className="mt-3 text-sm">{profile?.bio}</p>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-[#2F3336] max-w-md mx-auto">
        <div className="flex justify-around items-center h-16 text-[#71767B]">
          <button onClick={() => router.push('/')} className="hover:text-white"><Home className="w-6 h-6" /></button>
          <button className="hover:text-white"><Search className="w-6 h-6" /></button>
          <button className="hover:text-white"><Bell className="w-6 h-6" /></button>
          <button className="hover:text-white"><Mail className="w-6 h-6" /></button>
          <button className="text-white"><User className="w-6 h-6" /></button>
        </div>
      </nav>
    </div>
  )
                }
                
