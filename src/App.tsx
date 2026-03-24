import { useEffect, useState } from 'react';
import VoiceAgent from './components/VoiceAgent';
import Settings from './components/Settings';
import AuthForm from './components/AuthForm';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'agent' | 'settings'>('agent');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-8">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">Voice AI Agent</h1>
            <p className="text-slate-400 text-center mb-8">Sign in or create an account to get started</p>
            <AuthForm onAuthSuccess={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  return currentPage === 'agent' ? (
    <VoiceAgent onOpenSettings={() => setCurrentPage('settings')} />
  ) : (
    <Settings onBack={() => setCurrentPage('agent')} />
  );
}

export default App;
