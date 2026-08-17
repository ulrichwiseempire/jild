import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 🔒 MODIFIE TON CODE PIN ADMIN ICI :
const ADMIN_PIN = "1234" 

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [stories, setStories] = useState([])
  const [comments, setComments] = useState({})
  const [loading, setLoading] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true)
      fetchData()
    } else {
      alert("Code PIN incorrect !")
      setPinInput('')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    // Charger les histoires
    const { data: stData } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Charger les commentaires
    const { data: cmData } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })

    if (stData) setStories(stData)
    if (cmData) {
      const grouped = cmData.reduce((acc, c) => {
        acc[c.story_id] = acc[c.story_id] || []
        acc[c.story_id].push(c)
        return acc
      }, {})
      setComments(grouped)
    }
    setLoading(false)
  }

  const deleteStory = async (id) => {
    if (confirm("Supprimer définitivement ce récit et ses commentaires ?")) {
      await supabase.from('comments').delete().eq('story_id', id)
      await supabase.from('stories').delete().eq('id', id)
      fetchData()
    }
  }

  const deleteComment = async (id) => {
    if (confirm("Supprimer ce commentaire ?")) {
      await supabase.from('comments').delete().eq('id', id)
      fetchData()
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4">
          <h1 className="text-xl font-bold text-center text-sky-400">⚡ Espace Admin JILD</h1>
          <p className="text-xs text-slate-400 text-center">Entrez votre code secret pour accéder à la modération.</p>
          <input
            type="password"
            placeholder="Code PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-lg outline-none focus:border-sky-500"
          />
          <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 py-3 rounded-xl font-semibold text-sm">
            Déverrouiller
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-3xl mx-auto space-y-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-sky-400">Tableau de Modération</h1>
          <p className="text-xs text-slate-400">{stories.length} histoire(s) publiée(s)</p>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)} 
          className="text-xs bg-red-950/60 border border-red-800 text-red-300 px-3 py-1.5 rounded-lg">
          Quitter
        </button>
      </header>

      {loading ? (
        <p className="text-center text-slate-500 py-10">Chargement des données...</p>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => (
            <div key={story.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-sky-400 font-semibold">{story.author || 'Anonyme'}</span>
                  <span className="text-xs text-slate-500 ml-2">• {new Date(story.created_at).toLocaleString()}</span>
                  {story.title && <h3 className="font-bold text-slate-200 text-sm mt-1">{story.title}</h3>}
                </div>
                <button 
                  onClick={() => deleteStory(story.id)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1 rounded-lg font-medium">
                  🗑️ Supprimer Récit
                </button>
              </div>

              <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/60">
                {story.content}
              </p>

              {/* Commentaires rattachés */}
              {comments[story.id] && comments[story.id].length > 0 && (
                <div className="pl-4 border-l-2 border-slate-800 space-y-2 pt-2">
                  <p className="text-xs text-slate-500 font-semibold">Commentaires ({comments[story.id].length}) :</p>
                  {comments[story.id].map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-slate-950 p-2 rounded text-xs">
                      <span><strong className="text-slate-400">{c.author_name}:</strong> {c.content}</span>
                      <button 
                        onClick={() => deleteComment(c.id)}
                        className="text-red-400 hover:text-red-300 text-[10px] ml-2">
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
    }
              
