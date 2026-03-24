import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ApiKeyFormProps {
  onSave: () => void;
}

export default function ApiKeyForm({ onSave }: ApiKeyFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: err } = await supabase
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .maybeSingle();

      if (err) {
        console.error('Error loading API key:', err);
        return;
      }

      if (data) {
        setApiKey(data.api_key);
        setHasKey(true);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!apiKey.trim()) {
        setError('API key cannot be empty');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be signed in to save API key');
        setLoading(false);
        return;
      }

      if (hasKey) {
        const { error: err } = await supabase
          .from('user_api_keys')
          .update({ api_key: apiKey, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('user_api_keys')
          .insert([{ user_id: user.id, api_key: apiKey }]);

        if (err) throw err;
        setHasKey(true);
      }

      setSuccess('API key saved successfully');
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          OpenAI API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Your API key is securely stored and never logged. Get one at{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            platform.openai.com
          </a>
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving...' : 'Save API Key'}
      </button>
    </form>
  );
}
