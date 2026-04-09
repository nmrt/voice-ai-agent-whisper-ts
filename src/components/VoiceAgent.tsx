import { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  Settings as SettingsIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VoiceAgentProps {
  onOpenSettings: () => void;
}

export default function VoiceAgent({ onOpenSettings }: VoiceAgentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [apiKey, setApiKey] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      if (!apiKey) {
        setError('Please configure your OpenAI API key in settings');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        await processAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please grant permission.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // const transcribedText = await transcribeAudio(audioBlob);
      const transcribedText = '1, 2, 3';
      setTranscript(transcribedText);

      const newHistory = [
        ...conversationHistory,
        { role: 'user', content: transcribedText },
      ];

      const aiResponse = await getAIResponse(newHistory);
      setResponse(aiResponse);

      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: aiResponse },
      ]);

      await speakResponse(aiResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('key', apiKey);
    console.log(formData);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    return data.text;
  };

  const getAIResponse = async (
    history: Array<{ role: string; content: string }>
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('messages', JSON.stringify(history));
    console.log(formData);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          // 'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ messages: history, key: apiKey }),
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('AI response failed');
    }

    const data = await response.json();
    return data.message;
  };

  const speakResponse = async (text: string) => {
    setIsSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, key: apiKey }),
        }
      );

      if (!response.ok) {
        throw new Error('Text-to-speech failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setTranscript('');
    setResponse('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">
                Voice AI Agent
              </h1>
              <p className="text-slate-400">Powered by Whisper & GPT</p>
            </div>
            <button
              onClick={onOpenSettings}
              className="p-3 bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="flex justify-center mb-8">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`relative w-24 h-24 rounded-full transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50 scale-110'
                  : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/50'
              } ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              } flex items-center justify-center`}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
              {isRecording && (
                <span className="absolute -bottom-2 -right-2 flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500"></span>
                </span>
              )}
            </button>
          </div>

          {isSpeaking && (
            <div className="flex items-center justify-center mb-6 text-blue-400">
              <Volume2 className="w-5 h-5 mr-2 animate-pulse" />
              <span>Speaking...</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {conversationHistory.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-500/10 border border-blue-500/30 ml-8'
                    : 'bg-slate-700/50 border border-slate-600 mr-8'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-blue-500' : 'bg-slate-600'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <Mic className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </p>
                    <p className="text-white leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {conversationHistory.length > 0 && (
            <div className="text-center">
              <button
                onClick={clearConversation}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Clear Conversation
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            <p>
              {isRecording
                ? 'Click the button to stop recording'
                : isProcessing
                ? 'Processing your message...'
                : 'Click the microphone to start speaking'}
            </p>
          </div>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
