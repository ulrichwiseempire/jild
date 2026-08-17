import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Messages() {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    await supabase.from('messages').insert([
      { sender_id: user.id, content: newMessage }
    ])
    setNewMessage('')
    fetchMessages()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 flex flex-col justify-between max-w-2xl mx-auto">
      <header className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <Link href="/" className="text-sky-400 font-bold">← Retour au Fil</Link>
        <h1 className="text-xl font-bold">💬 Messagerie Directe</h1>
      </header>

      <main className="flex-grow py-4 space-y-3 overflow-y-auto max-h-[75vh]">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl text-sm max-w-xs ${m.sender_id === user?.id ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </main>

      <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none"
        />
        <button type="submit" className="bg-sky-600 px-5 py-3 rounded-xl font-bold text-sm">Envoyer</button>
      </form>
    </div>
  )
}

