import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Sparkles, Mail, Lock, User, AtSign } from 'lucide-react'

export default function Auth() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (isSignUp) {
      // 1. Inscription Supabase
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      // 2. Création automatique du profil avec le pseudo unique
      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            username: username.toLowerCase().trim(),
            full_name: fullName,
            is_verified: false
          }
        ])

        if (profileError) {
          if (profileError.code === '23505') {
            setErrorMsg('Ce nom d\'utilisateur est déjà pris.')
          } else {
            setErrorMsg(profileError.message)
          }
          setLoading(false)
          return
        }
      }
      router.push('/')
    } else {
      // Connexion classique
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg('Email ou mot de passe incorrect.')
        setLoading(false)
        return
      }
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] flex flex-col justify-center px-6 py-12 max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 bg-[#1D9BF0] rounded-full flex items-center justify-center font-black text-2xl text-white">
          J
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-2">
        {isSignUp ? 'Rejoignez JILD aujourd\'hui' : 'Connexion à JILD'}
      </h2>
      <p className="text-xs text-[#71767B] text-center mb-8">
        {isSignUp ? 'Créez votre compte en quelques secondes.' : 'Heureux de vous revoir.'}
      </p>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4 text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <>
            <div className="relative">
              <User className="w-4 h-4 text-[#71767B] absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#16181C] border border-[#2F3336] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#71767B] outline-none focus:border-[#1D9BF0]"
              />
            </div>

            <div className="relative">
              <AtSign className="w-4 h-4 text-[#71767B] absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder="Nom d'utilisateur (ex: kodjo)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#16181C] border border-[#2F3336] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#71767B] outline-none focus:border-[#1D9BF0]"
              />
            </div>
          </>
        )}

        <div className="relative">
          <Mail className="w-4 h-4 text-[#71767B] absolute left-3 top-3.5" />
          <input
            type="email"
            required
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#16181C] border border-[#2F3336] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#71767B] outline-none focus:border-[#1D9BF0]"
          />
        </div>

        <div className="relative">
          <Lock className="w-4 h-4 text-[#71767B] absolute left-3 top-3.5" />
          <input
            type="password"
            required
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#16181C] border border-[#2F3336] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#71767B] outline-none focus:border-[#1D9BF0]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1D9BF0] hover:bg-blue-500 font-bold py-3 rounded-full text-white text-sm transition"
        >
          {loading ? 'Chargement...' : isSignUp ? 'S\'inscrire' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-xs text-[#1D9BF0] hover:underline"
        >
          {isSignUp ? 'Vous avez déjà un compte ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
        </button>
      </div>
    </div>
  )
            }
    
