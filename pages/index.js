import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const [stories, setStories] = useState([])
  const [comments, setComments] = useState({})
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [newComment, setNewComment] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    fetchStories()
    fetchComments()

    return () => subscription.unsubscribe()
  }, [])

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setStories(data)
  }

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      const grouped = data.reduce((acc, comment) => {
        acc[comment.story_id] = acc[comment.story_id] || []
        acc[comment.story_id].push(comment)
        return acc
      }, {})
      setComments(grouped)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      })
      if (error) alert(error.message)
      else {
        alert('Compte créé avec succès !')
        setIsAuthOpen(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else setIsAuthOpen(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!user) {
      setIsAuthOpen(true)
      return
    }
    if (!content.trim() && !imageFile) return

    setUploading(true)
    let imageUrl = null

    // Upload de l'image si sélectionnée
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, imageFile)

      if (uploadError) {
        alert("Erreur lors de l'envoi de l'image : " + uploadError.message)
        setUploading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName)
      
      imageUrl = publicUrlData.publicUrl
    }

    const authorName = user.user_metadata?.username || user.email.split('@')[0]

    const { error } = await supabase.from('stories').insert([
      {
        content,
        author: authorName,
        user_id: user.id,
        image_url: imageUrl
      }
    ])

    setUploading(false)

    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      setContent('')
      setImageFile(null)
      fetchStories()
    }
  }

  const handleDeleteStory = async (id) => {
    if (confirm('Voulez-vous vraiment supprimer ce post ?')) {
      const { error } = await supabase.from('stories').delete().eq('id', id)
      if (error) alert('Erreur : ' + error.message)
      else fetchStories()
    }
  }

  const handleAddComment = async (storyId) => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }
    const commentText = newComment[storyId]
    if (!commentText?.trim()) return

    const authorName = user.user_metadata?.username || user.email.split('@')[0]

    const { error } = await supabase.from('comments').insert([
      {
        story_id: storyId,
        content: commentText,
        author_name: authorName,
        user_id: user.id
      }
    ])

    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      setNewComment({ ...newComment, [storyId]: '' })
      fetchComments()
    }
  }

  const getUserInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* HEADER STYLE FACEBOOK */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center w-full">
          <h1 className="text-2xl font-black tracking-wider text-sky-400">JILD</h1>
          <div>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
                  {getUserInitial(user.user_metadata?.username || user.email)}
                </div>
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">
                  {user.user_metadata?.username || user.email.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-sm bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg font-semibold"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-2xl mx-auto w-full p-4 flex-grow space-y-6">

        {/* MODAL AUTH */}
        {isAuthOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md relative">
              <button
                onClick={() => setIsAuthOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>

              <h2 className="text-xl font-bold mb-4">
                {isSignUp ? 'Rejoindre JILD' : 'Bienvenue sur JILD'}
              </h2>

              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <input
                    type="text"
                    placeholder="Ton nom d'utilisateur"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-sky-500 text-sm"
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Adresse e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-sky-500 text-sm"
                  required
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-sky-500 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-semibold text-white"
                >
                  {isSignUp ? "Créer mon compte" : 'Se connecter'}
                </button>
              </form>

              <p className="text-xs text-slate-400 mt-4 text-center">
                {isSignUp ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sky-400 underline font-medium"
                >
                  {isSignUp ? 'Se connecter' : "S'inscrire"}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* BOÎTE DE PUBLICATION STYLE FACEBOOK */}
        <section className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold">
              {user ? getUserInitial(user.user_metadata?.username || user.email) : '👤'}
            </div>
            <textarea
              placeholder={user ? `Qu'as-tu à dire aujourd'hui, ${user.user_metadata?.username || user.email.split('@')[0]} ?` : "Connecte-toi pour publier un message..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onClick={() => { if (!user) setIsAuthOpen(true) }}
              rows="3"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-sky-500 resize-none"
            />
          </div>

          {/* APERÇU DE L'IMAGE CHOISIE */}
          {imageFile && (
            <div className="relative mt-2">
              <img src={URL.createObjectURL(imageFile)} alt="Aperçu" className="max-h-48 rounded-xl object-cover w-full border border-slate-800" />
              <button 
                onClick={() => setImageFile(null)}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-sky-400 transition">
              <span className="text-base">📷</span> Ajouter une photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (!user) setIsAuthOpen(true)
                  else if (e.target.files[0]) setImageFile(e.target.files[0])
                }}
              />
            </label>

            <button
              onClick={handlePublish}
              disabled={uploading}
              className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 px-5 py-2 rounded-xl font-semibold text-xs text-white transition"
            >
              {uploading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </section>

        {/* FIL D'ACTUALITÉ / POSTS */}
        <section className="space-y-4">
          {stories.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              Aucune publication pour le moment.
            </p>
          ) : (
            stories.map((story) => (
              <article key={story.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                
                {/* EN-TÊTE DU POST */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-sm">
                      {getUserInitial(story.author)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">{story.author}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(story.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {user && story.user_id === user.id && (
                    <button
                      onClick={() => handleDeleteStory(story.id)}
                      className="text-xs text-red-400 hover:text-red-300 bg-red-950/40 px-2 py-1 rounded-lg border border-red-900/50"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                {/* TEXTE DU POST */}
                {story.content && (
                  <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
                    {story.content}
                  </p>
                )}

                {/* IMAGE DU POST */}
                {story.image_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-800">
                    <img src={story.image_url} alt="Publication" className="w-full max-h-96 object-cover" />
                  </div>
                )}

                {/* SECTION COMMENTAIRES */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="space-y-2">
                    {(comments[story.id] || []).map((c) => (
                      <div key={c.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/50 text-xs">
                        <span className="font-semibold text-sky-400">{c.author_name} : </span>
                        <span className="text-slate-300">{c.content}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Écrire un commentaire..."
                      value={newComment[story.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [story.id]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(story.id) }}
                      className="flex-grow p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-sky-500"
                    />
                    <button
                      onClick={() => handleAddComment(story.id)}
                      className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-semibold text-sky-400"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>

              </article>
            ))
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 p-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} JILD — Réseau social libre & bienveillant</p>
      </footer>

    </div>
  )
}
  
