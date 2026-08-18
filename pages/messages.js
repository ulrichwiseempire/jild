import Link from 'next/link'

export default function Messages() {
  return (
    <div className="min-h-screen bg-[#090d16] text-white p-4 max-w-lg mx-auto pb-20">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4 mb-6">
        <Link href="/" className="text-xl">⬅️</Link>
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div className="text-center py-20 text-slate-500 space-y-2">
        <p className="text-4xl">💬</p>
        <p className="text-sm font-medium">Vos discussions apparaîtront ici.</p>
      </div>
    </div>
  )
}

