import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Home, Search, Bell, Mail, ArrowLeft, Camera, User, Edit3, Check } from 'lucide-react'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // États pour l'édition
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

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
      .maybeSingle()

    // Si le profil n'existe pas encore, on extrait le nom depuis l'email/metadonnées
    if (!data) {
      const defaultUsername = user.email ? user.email.split('@')[0] : 'utilisateur'
      const defaultProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || defaultUsername,
        username: defaultUsername,
        bio: '',
      }
      await supabase.from('profiles').insert([defaultProfile])
      setProfile(defaultProfile)
      setFullName(defaultProfile.full_name)
      setUsername(defaultProfile.username)
      setBio('')
    } else {
      setProfile(data)
      setFullName(data.full_name || '')
      setUsername(data.username || '')
      setBio(data.bio || '')
    }

    setLoading(false)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const updates = {
        id: user.id,
        full_name: fullName,
        username: username,
        bio: bio,
        updated_at: new Date(),
      }

      let { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error

      setProfile({ ...profile, ...updates })
      setIsEditing(false)
      alert('Profil mis à jour !')
    } catch (error) {
      alert('Erreur lors de la mise à jour : ' + error.message)
    } finally {
      setLoading(false)
    }
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
            {profile?.full_name || 'Mon Profil'}
          </h1>
          <p className="text-xs text-[#71767B]">@{profile?.username || 'utilisateur'}</p>
        </div>
      </header>

      {loading ? (
        <div className="p-8 text-center text-[#71767B] text-sm">Chargement du profil...</div>
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

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="border border-[#536471] hover:bg-white/10 font-bold px-4 py-1.5 rounded-full text-xs text-white transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Annuler' : 'Éditer le profil'}
            </button>
          </div>

          {/* Formulaire d'édition ou affichage normal */}
          <div className="px-4">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3 mt-4">
                <div>
                  <label className="text-xs text-[#71767B]">Nom complet</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#16181C] border border-[#2F3336] rounded-lg p-2 text-sm text-white outline-none focus:border-[#1D9BF0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#71767B]">Nom d'utilisateur (@pseudo)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#16181C] border border-[#2F3336] rounded-lg p-2 text-sm text-white outline-none focus:border-[#1D9BF0]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#71767B]">Bio</label>
                  <textarea
                    rows="2"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#16181C] border border-[#2F3336] rounded-lg p-2 text-sm text-white outline-none focus:border-[#1D9BF0] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#1D9BF0] font-bold py-2 rounded-full text-xs text-white hover:bg-blue-500 transition"
                >
                  Enregistrer les modifications
                </button>
              </form>
            ) : (
              <div>
                <h2 className="font-bold text-xl">{profile?.full_name || 'Utilisateur'}</h2>
                <p className="text-[#71767B] text-sm">@{profile?.username || 'anonyme'}</p>
                <p className="mt-3 text-sm whitespace-pre-line">{profile?.bio || 'Aucune biographie pour le moment.'}</p>
              </div>
            )}
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
        
