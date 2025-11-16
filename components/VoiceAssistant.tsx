'use client';

import { useState, useEffect, useRef } from 'react';
import { processVoiceCommand } from '@/app/actions/voice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceAssistantProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function VoiceAssistant({
  messages,
  setMessages,
  isListening,
  setIsListening
}: VoiceAssistantProps) {
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ru-RU';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          handleVoiceInput(transcriptText);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleVoiceInput = async (text: string) => {
    // Add user message
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);

    // Process with AI
    try {
      const response = await processVoiceCommand(text, messages);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

      // Speak response
      speakText(response);
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте ещё раз.'
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setTranscript('');
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="cyber-card p-8">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
        🎤 Голосовой интерфейс
      </h2>

      {/* Microphone Button */}
      <div className="flex flex-col items-center justify-center mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse shadow-2xl shadow-red-500/50'
              : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:scale-110 shadow-xl shadow-cyan-500/50'
          }`}
        >
          {isListening ? '⏹️' : '🎤'}
        </button>

        <p className="mt-4 text-sm text-gray-400">
          {isListening ? 'Слушаю...' : 'Нажмите, чтобы начать'}
        </p>
      </div>

      {/* Voice Waves Animation */}
      {isListening && (
        <div className="flex justify-center items-center mb-6">
          <div className="voice-wave" style={{ animationDelay: '0s' }}></div>
          <div className="voice-wave" style={{ animationDelay: '0.1s' }}></div>
          <div className="voice-wave" style={{ animationDelay: '0.2s' }}></div>
          <div className="voice-wave" style={{ animationDelay: '0.3s' }}></div>
          <div className="voice-wave" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}

      {/* Current Transcript */}
      {transcript && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-400 mb-1">Вы сказали:</p>
          <p className="text-lg">{transcript}</p>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <p className="text-sm text-cyan-400">Помощник говорит...</p>
          </div>
        </div>
      )}

      {/* Browser Compatibility Check */}
      {typeof window !== 'undefined' && !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mt-4">
          <p className="text-sm text-red-400">
            Ваш браузер не поддерживает распознавание речи. Используйте Chrome или Edge.
          </p>
        </div>
      )}
    </div>
  );
}
