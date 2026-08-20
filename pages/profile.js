import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/router';
import { User, Camera, Settings, LogOut, ArrowLeft } from 'lucide-react';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const router = Router();

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      let { data, error } = await supabase
        .from('profiles')
        .select(`username, avatar_url, bio`)
        .eq('id', user.id)
        .single();

      if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || '');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.log('Erreur:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({ username, bio, avatarUrl }) {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const updates = {
        id: user.id,
        username,
        bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      let { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      alert('Profil mis à jour !');
    } catch (error) {
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-md mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/')} className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Profil</h1>
        <button onClick={handleSignOut} className="p-2 text-red-500">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Photo de profil */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-4">
          <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-zinc-400" />
            )}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Nom d'utilisateur</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            placeholder="@pseudo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Lien de la photo (URL)</label>
          <input
            type="text"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 h-24"
            placeholder="Parle-nous de toi..."
          />
        </div>

        <button
          onClick={() => updateProfile({ username, bio, avatarUrl })}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition mt-4"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}
