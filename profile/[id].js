import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Profile() {
  const router = useRouter()
  const { id } = router.query // ID du profil visité

  const [currentUser, setCurrentUser] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [userStories, setUserStories] = useState([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null)
    })
  }, [])

  useEffect(() => {
    if (id) {
      fetchProfileData()
    }
  }, [id, currentUser])

  const fetchProfileData = async () => {
    setLoading(true)

    // 1. Récupérer les posts de cet utilisateur
    const { data: stories } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    setUserStories(stories || [])

    // Infos de base récupérées du premier post ou par défaut
    if (stories && stories.length > 0) {
      setProfileData({
        username: stories[0].author,
        avatar_url: stories[0].avatar_url
      })
    } else if (currentUser && currentUser.id === id) {
      setProfileData({
        username: currentUser.user_metadata?.username || currentUser.email.split('@')[0],
        avatar_url: currentUser.user_metadata?.avatar_url
      })
    } else {
      setProfileData({ username: 'Utilisateur', avatar_url: null })
    }

    // 2. Compter les Abonnés
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id)

    setFollowersCount(followers || 0)

    // 3. Compter les Abonnements
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id)

    setFollowingCount(following || 0)

    // 4. Vérifier si l'utilisateur actuel suit ce profil
    if (currentUser) {
      const { data: followCheck } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('following_id', id)

      setIsFollowing(followCheck && followCheck.length > 0)
    }

    setLoading(false)
  }

  const handleToggleFollow = async () => {
    if (!currentUser) return alert('Connecte-toi pour suivre cet utilisateur !')

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', id)
      setIsFollowing(false)
      setFollowersCount(prev => prev - 1)
    } else {
      await supabase.from('follows').insert([{ follower_id: currentUser.id, following_id: id }])
      setIsFollowing(true)
      setFollowersCount(prev => prev + 1)
    }
  }

  const isMyOwnProfile = currentUser && currentUser.id === id

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Chargement du profil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      
      {/* HEADER DE NAVIGATION */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sky-400 font-bold text-sm flex items-center gap-1">
            ← Retour au Fil
          </Link>
          <h1 className="font-bold text-base">{profileData?.username}</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* ENTÊTE DE PROFIL (STYLE INSTAGRAM) */}
        <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            
            {/* AVATAR */}
            {profileData?.avatar_url ? (
              <img src={profileData.avatar_url} className="w-20 h-20 rounded-full object-cover border-2 border-sky-500" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-sky-600 flex items-center justify-center text-2xl font-bold text-white border-2 border-sky-500">
                {profileData?.username ? profileData.username.charAt(0).toUpperCase() : '👤'}
              </div>
            )}

            {/* STATISTIQUES (POSTS, ABONNÉS, ABONNEMENTS) */}
            <div className="flex-1 flex justify-around text-center">
              <div>
                <p className="font-bold text-lg text-white">{userStories.length}</p>
                <p className="text-xs text-slate-400">Publications</p>
              </div>
              <div>
                <p className="font-bold text-lg text-white">{followersCount}</p>
                <p className="text-xs text-slate-400">Abonnés</p>
              </div>
              <div>
                <p className="font-bold text-lg text-white">{followingCount}</p>
                <p className="text-xs text-slate-400">Abonnements</p>
              </div>
            </div>
          </div>

          {/* NOM ET BIO */}
          <div>
            <h2 className="font-bold text-base text-white">{profileData?.username}</h2>
            <p className="text-xs text-slate-400 mt-1">Membre de la communauté JILD</p>
          </div>

          {/* BOUTONS D'ACTION */}
          <div className="flex gap-3">
            {isMyOwnProfile ? (
              <Link href="/" className="w-full text-center bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl font-semibold border border-slate-700">
                Modifier mon profil (sur le fil)
              </Link>
            ) : (
              <>
                <button
                  onClick={handleToggleFollow}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isFollowing
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-sky-500 hover:bg-sky-400 text-white'
                  }`}
                >
                  {isFollowing ? 'Abonné' : '+ Suivre'}
                </button>
                <Link
                  href={`/messages?user=${id}`}
                  className="flex-1 text-center bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-xl font-semibold border border-slate-700"
                >
                  💬 Message
                </Link>
              </>
            )}
          </div>
        </section>

        {/* GRILLE DES PUBLICATIONS */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Publications</h3>

          {userStories.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
              <p className="text-3xl">📷</p>
              <p className="text-sm font-semibold text-slate-300">Aucune publication pour le moment</p>
              <p className="text-xs text-slate-500">Les posts apparaîtront ici dès qu'il y en aura.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {userStories.map((story) => (
                <article key={story.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <p className="text-xs text-slate-500">{new Date(story.created_at).toLocaleDateString()}</p>
                  {story.content && <p className="text-slate-300 text-sm">{story.content}</p>}
                  {story.image_url && <img src={story.image_url} className="w-full max-h-80 object-cover rounded-xl border border-slate-800" />}
                </article>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
      }
      
