import { useState, useEffect } from 'react';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ApiKeyForm from './ApiKeyForm';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-8">
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="w-6 h-6 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>

          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-xs text-slate-400 mb-1">Signed in as</p>
            <p className="text-white font-medium break-all">{email}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">API Configuration</h2>
            <ApiKeyForm onSave={() => {}} />
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-700">
            <button
              onClick={onBack}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
            >
              Back to Agent
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-medium border border-red-500/50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
