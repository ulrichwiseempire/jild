import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Home, Search, Bell, Mail, ArrowLeft, Camera, User, Edit3, MapPin, Link as LinkIcon, Calendar } from 'lucide-react'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')

  // Champs d'édition
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')

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

    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!data) {
      const defaultUsername = user.email ? user.email.split('@')[0] : 'utilisateur'
      const defaultProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || defaultUsername,
        username: defaultUsername,
        bio: '',
        location: '',
        website: '',
        followers_count: 0,
        following_count: 0
      }
      await supabase.from('profiles').insert([defaultProfile])
      setProfile(defaultProfile)
      setFullName(defaultProfile.full_name)
      setUsername(defaultProfile.username)
    } else {
      setProfile(data)
      setFullName(data.full_name || '')
      setUsername(data.username || '')
      setBio(data.bio || '')
      setLocation(data.location || '')
      setWebsite(data.website || '')
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
        location: location,
        website: website,
        updated_at: new Date(),
      }

      let { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error

      setProfile({ ...profile, ...updates })
      setIsEditing(false)
    } catch (error) {
      alert('Erreur : ' + error.message)
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
    } catch (error) {
      alert('Erreur envoi image : ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] pb-20 max-w-md mx-auto border-x border-[#2F3336]">
      {/* En-tête */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-[#2F3336] z-10 flex items-center gap-6 px-4 h-14">
        <button onClick={() => router.push('/')} className="hover:bg-white/10 p-2 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-base leading-tight">{profile?.full_name || 'Profil'}</h1>
          <p className="text-xs text-[#71767B]">@{profile?.username || 'utilisateur'}</p>
        </div>
      </header>

      {loading ? (
        <div className="p-8 text-center text-[#71767B] text-sm">Chargement...</div>
      ) : (
        <div>
          {/* Bannière */}
          <div className="h-32 bg-[#202327]"></div>

          {/* Photo & Bouton Édition */}
          <div className="px-4 relative flex justify-between items-end -mt-12 mb-3">
            <div className="relative group w-24 h-24 rounded-full border-4 border-black bg-[#16181C] overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-[#71767B]" />
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition">
                <Camera className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
              </label>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="border border-[#536471] hover:bg-white/10 font-bold px-4 py-1.5 rounded-full text-xs text-white transition"
            >
              {isEditing ? 'Annuler' : 'Éditer le profil'}
            </button>
          </div>

          {/* Informations ou Formulaire */}
          <div className="px-4">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3 mt-4">
                <div>
                  <label className="text-xs text-[#71767B]">Nom</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#16181C] border border-[#2F3336] rounded-lg p-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#71767B]">Nom d'utilisateur</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#16181C] border border-[#2F3336] rounded-lg p-2 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs text-[#71767B]">Bio</label>
                  <textarea rows="2" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-[#16181C] border border-[#2F3336] rounded-lg p-2 text-sm text-white outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs text-[#71767B]">Localisation</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-[#16181C] border border-[#2F3336] rounded-lg p-2 text-sm text-white outline-none" />
                </div>
                <button type="submit" className="w-full bg-[#1D9BF0] font-bold py-2 rounded-full text-xs text-white">
                  Enregistrer
                </button>
              </form>
            ) : (
              <div>
                <h2 className="font-bold text-xl leading-tight">{profile?.full_name}</h2>
                <p className="text-[#71767B] text-sm">@{profile?.username}</p>

                {profile?.bio && <p className="mt-3 text-sm whitespace-pre-line">{profile.bio}</p>}

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-[#71767B]">
                  {profile?.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>
                  )}
                  {profile?.website && (
                    <span className="flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /><a href={profile.website} target="_blank" className="text-[#1D9BF0]">{profile.website}</a></span>
                  )}
                </div>

                {/* Abonnements / Abonnés */}
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="text-[#71767B]"><strong className="text-white">{profile?.following_count || 0}</strong> Abonnements</span>
                  <span className="text-[#71767B]"><strong className="text-white">{profile?.followers_count || 0}</strong> Abonnés</span>
                </div>
              </div>
            )}
          </div>

          {/* Onglets JILD */}
          <div className="flex border-b border-[#2F3336] mt-4 text-sm font-bold text-[#71767B]">
            {['posts', 'videos', 'musique', 'jaime'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center capitalize relative ${activeTab === tab ? 'text-white' : 'hover:bg-white/5'}`}
              >
                {tab === 'jaime' ? "J'aime" : tab}
                {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#1D9BF0] rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barre de navigation */}
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
                
