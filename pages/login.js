import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) // Pour basculer entre Connexion et Inscription

  // Connexion ou Inscription avec Email
  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (isSignUp) {
      // Inscription
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('Vérifiez votre email pour confirmer l\'inscription !')
    } else {
      // Connexion
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else router.push('/') // Redirige vers l'accueil
    }
    setLoading(false)
  }

  // Connexion avec Google
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Redirige vers l'accueil après succès
      },
    })
    if (error) alert(error.message)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        
        {/* Logo JILD */}
        <h1 className="text-5xl font-black text-[#1D9BF0] text-center mb-10">JILD</h1>

        <div className="bg-[#111] p-8 rounded-2xl border border-gray-800 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isSignUp ? 'Créer un compte' : 'Se connecter'}
          </h2>

          {/* Bouton Google */}
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 bg-white text-black font-bold py-3 rounded-full hover:bg-gray-200 transition mb-6 text-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continuer avec Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <hr className="flex-1 border-gray-800" />
            <span className="text-gray-500 text-xs">OU</span>
            <hr className="flex-1 border-gray-800" />
          </div>

          {/* Formulaire Email */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#1D9BF0] text-sm"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#1D9BF0] text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1D9BF0] text-white font-bold py-3 rounded-full hover:bg-blue-600 transition mt-2 text-sm"
            >
              {loading ? 'Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
            </button>
          </form>

          {/* Basculer entre Connexion et Inscription */}
          <p className="text-gray-500 text-center text-sm mt-6">
            {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
            {' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="text-[#1D9BF0] hover:underline"
            >
              {isSignUp ? 'Se connecter' : 'S\'inscrire'}
            </button>
          </p>

        </div>
      </div>
    </div>
  )
    }
              
