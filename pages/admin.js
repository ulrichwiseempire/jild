import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/router'
import { Shield, CheckCircle, Ban, ArrowLeft, User } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminAndFetchUsers()
  }, [])

  const checkAdminAndFetchUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    // Vérification du statut admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      alert("Accès refusé : Vous n'êtes pas administrateur.")
      router.push('/')
      return
    }

    setIsAdmin(true)
    fetchUsers()
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setUsers(data || [])
    setLoading(false)
  }

  const toggleVerify = async (userId, currentStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: !currentStatus })
      .eq('id', userId)

    if (!error) fetchUsers()
  }

  const toggleBan = async (userId, currentStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentStatus })
      .eq('id', userId)

    if (!error) fetchUsers()
  }

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Vérification des accès...</div>

  return (
    <div className="min-h-screen bg-black text-[#EFF3F4] max-w-2xl mx-auto p-4 border-x border-[#2F3336]">
      <header className="flex items-center justify-between pb-4 mb-6 border-b border-[#2F3336]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')}><ArrowLeft className="w-6 h-6 text-white" /></button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#1D9BF0]" /> Administration JILD
          </h1>
        </div>
        <span className="text-xs bg-[#16181C] px-3 py-1 rounded-full text-[#71767B]">Panel SuperAdmin</span>
      </header>

      <div className="space-y-4">
        {users.map((u) => (
          <div key={u.id} className="p-4 bg-[#16181C] rounded-2xl border border-[#2F3336] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#202327] overflow-hidden flex items-center justify-center">
                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-[#71767B]" />}
              </div>
              <div>
                <div className="flex items-center gap-1 font-bold">
                  {u.full_name || 'Sans nom'}
                  {u.is_verified && <CheckCircle className="w-4 h-4 text-[#1D9BF0] fill-current" />}
                  {u.is_banned && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">Banni</span>}
                </div>
                <p className="text-xs text-[#71767B]">@{u.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleVerify(u.id, u.is_verified)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  u.is_verified ? 'bg-blue-500/10 text-[#1D9BF0] border border-[#1D9BF0]' : 'bg-[#202327] text-white'
                }`}
              >
                {u.is_verified ? 'Certifié' : 'Certifier'}
              </button>

              <button
                onClick={() => toggleBan(u.id, u.is_banned)}
                className={`p-2 rounded-full transition ${
                  u.is_banned ? 'bg-red-500 text-white' : 'bg-[#202327] text-red-500 hover:bg-red-500/10'
                }`}
                title={u.is_banned ? 'Débannir' : 'Bannir'}
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
      }
      
