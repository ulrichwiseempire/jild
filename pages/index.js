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
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
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
    if (!content.trim()) return

    const authorName = isAnonymous 
      ? 'Anonyme' 
      : (user?.user_metadata?.username || user?.email?.split('@')[0] || 'Passager')

    const { error } = await supabase.from('stories').insert([
      {
        title: title || null,
        content,
        author: authorName,
        user_id: user?.id || null
      }
    ])

    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      setTitle('')
      setContent('')
      fetchStories()
    }
  }

  const handleDeleteStory = async (id) => {
    if (confirm('Es-tu sûr de vouloir supprimer ce récit ?')) {
      const { error } = await supabase.from('stories').delete().eq('id', id)
      if (error) alert('Erreur : ' + error.message)
      else fetchStories()
    }
  }

  const handleAddComment = async (storyId) => {
    const commentText = newComment[storyId]
    if (!commentText?.trim()) return

    const authorName = user 
      ? (user.user_metadata?.username || user.email.split('@')[0])
      : 'Anonyme'

    const { error } = await supabase.from('comments').insert([
      {
        story_id: storyId,
        content: commentText,
        author_name: authorName,
        user_id: user?.id || null
      }
    ])

    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      setNewComment({ ...newComment, [storyId]: '' })
      fetchComments()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* HEADER */}
      <header className="border-b border-slate-800 p-4 flex justify-between items-center max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-wider text-sky-400">JILD</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-300">
                👋 {user.user_metadata?.username || user.email.split('@')[0]}
              </span>
              <button 
                onClick={handleSignOut} 
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                Déconnexion
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)} 
              className="text-sm bg-sky-600 hover:bg-sky-500 text-white px-4 py-1.5 rounded-lg font-medium">
              Se connecter
            </button>
          )}
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-2xl mx-auto w-full p-4 flex-grow space-y-8">
        
        {/* MODAL AUTH */}
        {isAuthOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md relative">
              <button 
                onClick={() => setIsAuthOpen(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
              
              <h2 className="text-xl font-bold mb-4">
                {isSignUp ? 'Créer un compte' : 'Se connecter'}
              </h2>

              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <input
                    type="text"
                    placeholder="Ton pseudonyme"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-500"
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Adresse e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-sky-500"
                  required
                />
                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-semibold">
                  {isSignUp ? "S'inscrire" : 'Se connecter'}
                </button>
              </form>

              <p className="text-xs text-slate-400 mt-4 text-center">
                {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"} {' '}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="text-sky-400 underline">
                  {isSignUp ? 'Se connecter' : "S'inscrire"}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* BANNIÈRE D'EXPLICATION / COMMENT ÇA MARCHE */}
        <section className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-sky-400 text-center">💡 Comment fonctionne JILD ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-2">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-lg">✍️</span>
              <h3 className="font-semibold text-slate-100">1. Exprime-toi</h3>
              <p className="text-slate-400">Partage tes pensées ou ton histoire, avec ton pseudo ou en mode 100% anonyme.</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-lg">💬</span>
              <h3 className="font-semibold text-slate-100">2. Échange & Soutiens</h3>
              <p className="text-slate-400">Lis les récits des autres et laisse un mot chaleureux en commentaire.</p>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-lg">🛡️</span>
              <h3 className="font-semibold text-slate-100">3. Espace Sérénité</h3>
              <p className="text-slate-400">Un lieu d'écoute sans jugement. Respect et bienveillance obligatoires.</p>
            </div>
          </div>
        </section>

        {/* FORMULAIRE POST */}
        <section className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Raconter ton histoire</h2>
          <form onSubmit={handlePublish} className="space-y-3">
            <input
              type="text"
              placeholder="Titre de ton récit (optionnel)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-sky-500"
            />
            <textarea
              placeholder="Libère ce que tu as sur le cœur..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="4"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-sky-500 resize-none"
              required
            />
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAnonymous} 
                  onChange={(e) => setIsAnonymous(e.target.checked)} 
                  className="rounded border-slate-700"
                />
                Poster en mode 100% anonyme
              </label>
            </div>

            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-medium text-sm">
              Partager mon histoire
            </button>
          </form>
        </section>

        {/* FLUX DE MESSAGES */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-200">Les histoires partagées</h2>
          {stories.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">
              Aucune histoire pour le moment. Sois le premier à t'exprimer...
            </p>
          ) : (
            stories.map((story) => (
              <article key={story.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    {story.title && <h3 className="font-semibold text-slate-100 mb-1">{story.title}</h3>}
                    <p className="text-xs text-slate-400">Par <span className="text-sky-400">{story.author}</span> • {new Date(story.created_at).toLocaleDateString()}</p>
                  </div>
                  {/* Bouton Supprimer */}
                  <button 
                    onClick={() => handleDeleteStory(story.id)} 
                    className="text-xs text-red-400 hover:text-red-300 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/50">
                    Supprimer
                  </button>
                </div>

                <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">{story.content}</p>

                {/* SECTION COMMENTAIRES */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Commentaires</h4>
                  
                  {/* Liste des commentaires */}
                  <div className="space-y-2">
                    {(comments[story.id] || []).map((c) => (
                      <div key={c.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/50 text-xs">
                        <span className="font-semibold text-sky-400">{c.author_name} : </span>
                        <span className="text-slate-300">{c.content}</span>
                      </div>
                    ))}
                  </div>

                  {/* Ajouter un commentaire */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Laisser un mot de soutien..."
                      value={newComment[story.id] || ''}
                      onChange={(e) => setNewComment({ ...newComment, [story.id]: e.target.value })}
                      className="flex-grow p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-sky-500"
                    />
                    <button 
                      onClick={() => handleAddComment(story.id)}
                      className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-medium text-sky-400 border border-slate-700">
                      Envoyer
                    </button>
                  </div>
                </div>

              </article>
            ))
          )}
        </section>

      </main>

      {/* FOOTER & CHARTE */}
      <footer className="border-t border-slate-800 bg-slate-950 p-6 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-400">JILD — Un espace libre & bienveillant</p>
        <p className="max-w-md mx-auto leading-relaxed">
          🚫 <strong className="text-slate-400">Règles & Modération :</strong> Les propos haineux, le harcèlement, la divulgation d'informations privées et les contenus illégaux sont strictement interdits.
        </p>
        <p className="pt-2 text-slate-600">© 2026 JILD. Tous droits réservés.</p>
      </footer>

    </div>
  )
                      }
                      
