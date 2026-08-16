import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [stories, setStories] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setStories(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    // 1. Vérification du filtre automatique (bad words)
    const { data: badWords } = await supabase.from('bad_words').select('word')
    const textToCheck = `${title} ${content}`.toLowerCase()
    
    const containsBadWord = badWords?.some(({ word }) => 
      new RegExp(`\\b${word}\\b`, 'i').test(textToCheck)
    )

    if (containsBadWord) {
      setErrorMessage("Votre message contient des mots inappropriés vis-à-vis de la charte de bienveillance.")
      setLoading(false)
      return
    }

    // 2. Publication de l'histoire
    const displayPseudo = isAnonymous || !pseudo.trim() ? 'Une voix anonyme' : pseudo

    const { error } = await supabase.from('stories').insert([
      {
        title: title.trim() || 'Sans titre',
        content: content.trim(),
        display_pseudo: displayPseudo,
        is_anonymous: isAnonymous,
        status: 'published'
      }
    ])

    if (error) {
      setErrorMessage("Erreur lors de la publication : " + error.message)
    } else {
      setTitle('')
      setContent('')
      setPseudo('')
      fetchStories()
    }

    setLoading(false)
  }

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', letterSpacing: '4px', color: '#38bdf8' }}>JILD</h1>
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Un espace libre pour se raconter et se délivrer.</p>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Formulaire de publication */}
        <section style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Raconter ton histoire</h2>
          
          {errorMessage && (
            <p style={{ color: '#ef4444', backgroundColor: '#450a0a', padding: '10px', borderRadius: '6px', fontSize: '0.9rem' }}>
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Titre de ton récit (optionnel)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}
            />

            <textarea
              required
              rows={5}
              placeholder="Libère ce que tu as sur le cœur..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff' }}
            />

            <input
              type="text"
              placeholder="Ton pseudonyme (ex: PassagerDuSoir)"
              value={pseudo}
              disabled={isAnonymous}
              onChange={(e) => setPseudo(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', opacity: isAnonymous ? 0.5 : 1 }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', cursor: 'pointer', fontSize: '0.9rem', color: '#94a3b8' }}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Poster en mode 100% anonyme
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? 'Publication...' : 'Partager mon histoire'}
            </button>
          </form>
        </section>

        {/* Liste des histoires */}
        <section>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#94a3b8' }}>Les histoires partagées</h2>
          
          {stories.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center' }}>Aucune histoire pour le moment. Sois le premier à t'exprimer...</p>
          ) : (
            stories.map((story) => (
              <article key={story.id} style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#f1f5f9', marginBottom: '8px' }}>{story.title}</h3>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', whitespace: 'pre-line' }}>{story.content}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '0.8rem', color: '#64748b' }}>
                  <span>Par <strong>{story.display_pseudo}</strong></span>
                  <span>{new Date(story.created_at).toLocaleDateString()}</span>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  )
  }
        
