import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('Compte créé ! Vérifie tes emails pour valider.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-cyan-400">JILD</h1>
          <p className="text-xs text-slate-400">
            {isSignUp ? 'Créer un nouveau compte' : 'Connecte-toi à ton espace'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500" 
              placeholder="votreemail@gmail.com"
            />
          </div>
          <div>
            <label className="text-slate-300 block mb-1">Mot de passe</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500" 
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-cyan-500 text-black font-bold py-3 rounded-lg hover:bg-cyan-400 transition"
          >
            {loading ? 'Chargement...' : isSignUp ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-cyan-400 font-semibold underline ml-1"
          >
            {isSignUp ? 'Se connecter' : 'S\'inscrire'}
          </button>
        </div>
      </div>
    </div>
  )
    }
                
