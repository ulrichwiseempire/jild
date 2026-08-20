import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Home, Search, Bell, Mail, Plus, User, ArrowLeft, Camera } from 'lucide-react'

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

    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }
    setLoading(false)
  }

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image.')
      }

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

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: avatarUrl, updated_at: new Date() })

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: avatarUrl })
      alert('Photo de profil mise à jour !')
    } catch (error) {
      alert('Erreur lors de l’envoi : ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      {/* En-tête avec bouton retour */}
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
        <div className="p-8 text-center text-[#71767B] text-sm">Chargement du profil...</div>
      ) : (
        <div>
          {/* Bannière du profil */}
          <div className="h-32 bg-[#202327]"></div>

          {/* Avatar et bouton Modifier */}
          <div className="px-4 relative flex justify-between items-end -mt-12 mb-4">
            <div className="relative group w-24 h-24 rounded-full border-4 border-black bg-[#16181C] overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{profile?.username?.[0]?.toUpperCase() || 'U'}</span>
              )}

              {/* Bouton de changement de photo sur l'avatar */}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Camera className="w-6 h-6 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={uploadAvatar} 
                  disabled={uploading} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Infos de l'utilisateur */}
          <div className="px-4">
            <h2 className="font-bold text-xl">{profile?.full_name || 'Utilisateur'}</h2>
            <p className="text-[#71767B] text-sm">@{profile?.username || 'anonyme'}</p>
            <p className="mt-3 text-sm">{profile?.bio || 'Pas encore de bio.'}</p>
          </div>
        </div>
      )}

      {/* Navigation du bas */}
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
