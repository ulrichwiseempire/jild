import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowLeft, User, ShieldCheck, LogOut, Save, CheckCircle2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Parametres() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setUsername(data.username || '')
        setFullName(data.full_name || '')
        setBio(data.bio || '')
        setIsVerified(data.is_verified || false)
      }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: username.toLowerCase().trim(),
      full_name: fullName,
      bio: bio,
      updated_at: new Date()
    })

    setLoading(false)
    if (error) {
      if (error.code === '23505') {
        setMessage('❌ Ce nom d\'utilisateur est déjà pris.')
      } else {
        setMessage('❌ Erreur lors de la sauvegarde.')
      }
    } else {
      setMessage('✅ Profil mis à jour avec succès !')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 p-4 max-w-md mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Retour</span>
        </Link>
        <h1 className="text-base font-bold">Paramètres du compte</h1>
        <div className="w-5" />
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${message.includes('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      {/* Badge de statut */}
      <div className="bg-[#161B22] border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-500" />
          <div>
            <p className="text-xs font-bold">Statut du compte</p>
            <p className="text-[10px] text-slate-400">
              {isVerified ? 'Compte certifié Officiel' : 'Compte Standard'}
            </p>
          </div>
        </div>
        {isVerified && <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500" />}
      </div>

      {/* Formulaire de modification */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">Nom d'utilisateur (@pseudo)</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#161B22] border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
            placeholder="kodjo"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">Nom complet</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[#161B22] border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
            placeholder="Kodjo Developer"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">Biographie</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-[#161B22] border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 h-24 resize-none transition-all"
            placeholder="Parlez un peu de vous..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>

      {/* Zone Danger / Déconnexion */}
      <div className="pt-6 border-t border-slate-800 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
        }
        
