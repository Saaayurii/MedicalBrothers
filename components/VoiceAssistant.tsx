'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

// Deepgram SDK configuration
const DEEPGRAM_MODEL = 'nova-2';
const DEEPGRAM_LANGUAGE = 'ru';

export default function VoiceAssistant({
  messages,
  setMessages,
  isListening,
  setIsListening
}: VoiceAssistantProps) {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useDeepgram, setUseDeepgram] = useState(true);
  const [confidence, setConfidence] = useState<number | null>(null);

  // Refs for Deepgram
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');

  // Ref for Web Speech API fallback
  const recognitionRef = useRef<any>(null);
  const voicesLoadedRef = useRef<boolean>(false);

  // Initialize Web Speech API as fallback
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ru-RU';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;

        if (event.results[current].isFinal) {
          setTranscript(transcriptText);
          handleVoiceInput(transcriptText);
        } else {
          setInterimTranscript(transcriptText);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        handleRecognitionError(event.error);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize TTS voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Load voices immediately if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesLoadedRef.current = true;
        console.log('TTS voices loaded:', voices.length);
      }

      // Listen for voices changed event (some browsers need this)
      const handleVoicesChanged = () => {
        const voices = window.speechSynthesis.getVoices();
        voicesLoadedRef.current = voices.length > 0;
        console.log('TTS voices changed, loaded:', voices.length);
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

      // Try to trigger voice loading
      window.speechSynthesis.getVoices();

      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        cleanup();
      };
    }

    // Check microphone permission
    checkMicrophonePermission();

    // Check Deepgram availability on mount
    checkDeepgramAvailability();

    return () => {
      cleanup();
    };
  }, []);

  const checkDeepgramAvailability = async () => {
    try {
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: new FormData(), // Empty request just to check if API key is configured
      });
      const data = await response.json();

      // If API key not configured, use Web Speech API from start
      if (data.error && (
        data.error.includes('API key not configured') ||
        data.error.includes('No audio file provided') // This is OK - API is configured
      )) {
        if (data.error.includes('API key not configured')) {
          console.log('Deepgram не настроен, используется Web Speech API');
          setUseDeepgram(false);
        }
      }
    } catch (error) {
      console.log('Не удалось проверить Deepgram, используется Web Speech API');
      setUseDeepgram(false);
    }
  };

  const checkMicrophonePermission = async () => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
        };
      } catch {
        setPermissionStatus('unknown');
      }
    }
  };

  const handleRecognitionError = (error: string) => {
    switch (error) {
      case 'not-allowed':
        setErrorMessage('Доступ к микрофону запрещён. Пожалуйста, разрешите доступ в настройках браузера.');
        setPermissionStatus('denied');
        break;
      case 'no-speech':
        setErrorMessage('Речь не обнаружена. Попробуйте ещё раз.');
        break;
      case 'audio-capture':
        setErrorMessage('Микрофон не найден. Проверьте подключение микрофона.');
        break;
      case 'network':
        setErrorMessage('Ошибка сети. Проверьте подключение к интернету.');
        break;
      case 'aborted':
        break;
      default:
        setErrorMessage(`Ошибка распознавания: ${error}`);
    }
  };

  const cleanup = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      setErrorMessage(null);
      return true;
    } catch (error) {
      setPermissionStatus('denied');
      setErrorMessage('Доступ к микрофону запрещён. Пожалуйста, разрешите доступ в настройках браузера.');
      return false;
    }
  };

  // Deepgram live transcription via server proxy
  const startDeepgramListening = async () => {
    try {
      // Get microphone stream first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      streamRef.current = stream;
      setPermissionStatus('granted');

      // Use file-based transcription instead of WebSocket (more reliable)
      // Collect audio and send to server API
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunks.length === 0) {
          setInterimTranscript('');
          setErrorMessage('Аудио не записано. Попробуйте ещё раз.');
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size, 'bytes');

        // Send to Deepgram via server API
        try {
          setInterimTranscript('Распознаю речь...');

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          console.log('Transcription response:', data);

          if (response.ok && data.transcript) {
            setTranscript(data.transcript);
            setConfidence(data.confidence);
            setInterimTranscript('');
            handleVoiceInput(data.transcript);
          } else if (data.error) {
            // API returned an error
            console.error('Deepgram API error:', data.error);
            // Check if it's Deepgram not configured or failed
            if (data.error.includes('API key not configured') ||
                data.error.includes('Failed to transcribe') ||
                data.error.includes('INVALID_AUTH')) {
              // Fallback to Web Speech API if Deepgram not configured
              console.log('Переключаюсь на Web Speech API...');
              setErrorMessage('Deepgram недоступен. Используется встроенное распознавание речи браузера.');
              setUseDeepgram(false);
              setInterimTranscript('');
              // Automatically restart with Web Speech API
              setTimeout(() => {
                setErrorMessage(null);
                startWebSpeechListening();
              }, 1000);
            } else {
              setErrorMessage(`Ошибка: ${data.error}`);
              setInterimTranscript('');
            }
          } else {
            setErrorMessage('Речь не распознана. Попробуйте говорить громче и чётче.');
            setInterimTranscript('');
          }
        } catch (error) {
          console.error('Deepgram transcription error:', error);
          setErrorMessage('Ошибка сети. Переключаюсь на встроенное распознавание.');
          setUseDeepgram(false);
          // Automatically restart with Web Speech API
          setTimeout(() => {
            setErrorMessage(null);
            startWebSpeechListening();
          }, 1000);
          setInterimTranscript('');
        }
      };

      // Start recording
      mediaRecorder.start();

      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
      lastTranscriptRef.current = '';
      setConfidence(null);
      setErrorMessage(null);

      // Show interim indicator while recording
      setInterimTranscript('Запись...');

    } catch (error) {
      console.error('Error starting Deepgram:', error);
      setUseDeepgram(false);
      startWebSpeechListening();
    }
  };

  const stopDeepgramListening = (submitTranscript: boolean = true) => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Stop MediaRecorder - this will trigger onstop which sends to Deepgram API
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
    setInterimTranscript('Обрабатываю...');
  };

  // Web Speech API fallback
  const startWebSpeechListening = async () => {
    if (!recognitionRef.current) {
      setErrorMessage('Ваш браузер не поддерживает распознавание речи. Используйте Chrome или Edge.');
      return;
    }

    try {
      setTranscript('');
      setInterimTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error: any) {
      setIsListening(false);
      if (error.message?.includes('already started')) {
        recognitionRef.current.stop();
      } else {
        setErrorMessage('Не удалось запустить распознавание речи.');
      }
    }
  };

  const stopWebSpeechListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Unified start/stop functions
  const startListening = async () => {
    setErrorMessage(null);

    if (permissionStatus !== 'granted') {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    if (useDeepgram) {
      await startDeepgramListening();
    } else {
      await startWebSpeechListening();
    }
  };

  const stopListening = () => {
    if (useDeepgram) {
      stopDeepgramListening(true);
    } else {
      stopWebSpeechListening();
    }
  };

  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    // Add user message
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);

    // Process with AI (Ollama + Intent Classification)
    try {
      const response = await processVoiceCommand(text, messages);
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);

      // Clean response for TTS (remove non-Cyrillic characters except basic punctuation)
      const cleanedResponse = cleanTextForTTS(response);
      console.log('Original response:', response);
      console.log('Cleaned for TTS:', cleanedResponse);

      // Try to speak using Web Speech API first, fallback to server TTS
      await speakTextWithFallback(cleanedResponse);
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте ещё раз.'
      };
      setMessages(prev => [...prev, errorMsg]);
      // Speak error message too
      await speakTextWithFallback(errorMsg.content);
    }

    setTranscript('');
    setInterimTranscript('');
    lastTranscriptRef.current = '';
    setIsProcessing(false);
  };

  // Speak with fallback to server TTS if Web Speech API fails
  const speakTextWithFallback = async (text: string) => {
    try {
      // Try Web Speech API first
      speakText(text);

      // Check if speech actually started after a delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // If still not speaking, try server TTS
      if (!isSpeaking && window.speechSynthesis && !window.speechSynthesis.speaking) {
        console.log('⚠️ Web Speech API not working, trying server TTS...');
        await speakWithServerTTS(text);
      }
    } catch (error) {
      console.error('Error in speakTextWithFallback:', error);
      // Fallback to server TTS
      await speakWithServerTTS(text);
    }
  };

  // Use server-side TTS (FREE - Piper TTS)
  const speakWithServerTTS = async (text: string) => {
    try {
      console.log('🌐 Using FREE server TTS (Piper) for:', text.substring(0, 50));
      setIsSpeaking(true);

      // Try Piper TTS first (FREE)
      let response = await fetch('/api/voice/piper-speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      // If Piper not available, try OpenAI TTS (if configured)
      if (!response.ok) {
        console.log('⚠️ Piper TTS not available, trying OpenAI TTS...');
        response = await fetch('/api/voice/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      }

      if (!response.ok) {
        throw new Error('Server TTS failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onplay = () => console.log('✅ Server TTS started');
      audio.onended = () => {
        console.log('✅ Server TTS ended');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        console.error('❌ Server TTS playback error');
        setIsSpeaking(false);
      };

      await audio.play();
    } catch (error) {
      console.error('❌ Server TTS error:', error);
      setIsSpeaking(false);
    }
  };

  // Helper function to clean text for TTS
  const cleanTextForTTS = (text: string): string => {
    // Remove ONLY Chinese/Japanese/Korean characters
    // KEEP: Cyrillic (Russian), Latin letters, numbers, basic punctuation, spaces
    let cleaned = text
      // Remove CJK Unified Ideographs (Chinese characters)
      .replace(/[\u4E00-\u9FFF]/g, '')
      // Remove CJK Extension A
      .replace(/[\u3400-\u4DBF]/g, '')
      // Remove Hiragana (Japanese)
      .replace(/[\u3040-\u309F]/g, '')
      // Remove Katakana (Japanese)
      .replace(/[\u30A0-\u30FF]/g, '')
      // Remove CJK symbols and punctuation
      .replace(/[\u3000-\u303F]/g, '')
      // Remove Halfwidth and Fullwidth Forms (mostly for Asian languages)
      .replace(/[\uFF00-\uFFEF]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();

    console.log('After CJK removal:', cleaned);

    // If response got truncated mid-sentence (incomplete), find last complete sentence
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      cleaned = sentences.join(' ');
      console.log('After sentence extraction:', cleaned);
    }

    // Limit length for TTS (too long responses might not speak well)
    const maxLength = 500;
    if (cleaned.length > maxLength) {
      // Find last complete sentence within limit
      const truncated = cleaned.substring(0, maxLength);
      const lastPeriod = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );
      if (lastPeriod > 0) {
        cleaned = truncated.substring(0, lastPeriod + 1);
      } else {
        cleaned = truncated + '...';
      }
      console.log('After length limit:', cleaned);
    }

    return cleaned || 'Извините, не смог обработать ответ.';
  };

  // Built-in Text-to-Speech using Web Speech API
  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis not supported in this browser');
      return;
    }

    // Function to actually speak the text
    const doSpeak = () => {
      console.log('🎯 doSpeak called with text length:', text.length);

      // Only cancel if something is ALREADY speaking
      // Don't cancel unconditionally as it can interrupt our own utterance
      if (window.speechSynthesis.speaking) {
        console.log('🛑 Cancelling previous speech');
        window.speechSynthesis.cancel();
        // Small delay to ensure cancel completes
        setTimeout(() => startSpeaking(), 100);
        return;
      }

      startSpeaking();
    };

    const startSpeaking = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a Russian voice
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);

      // PREFER local voices (localService: true) as they're more reliable
      let russianVoice = voices.find(voice =>
        voice.lang === 'ru-RU' && voice.localService
      );

      // Fallback to any local Russian voice
      if (!russianVoice) {
        russianVoice = voices.find(voice =>
          voice.lang && voice.lang.startsWith('ru') && voice.localService
        );
      }

      // If no local voice, use any Russian voice (including cloud)
      if (!russianVoice) {
        russianVoice = voices.find(voice =>
          voice.lang === 'ru-RU'
        );
      }

      // Fallback to any Russian voice
      if (!russianVoice) {
        russianVoice = voices.find(voice =>
          voice.lang && voice.lang.startsWith('ru')
        );
      }

      // Last resort: name-based search
      if (!russianVoice) {
        russianVoice = voices.find(voice =>
          voice.name.toLowerCase().includes('russian') ||
          voice.name.toLowerCase().includes('ru') ||
          voice.name.toLowerCase().includes('русский')
        );
      }

      if (russianVoice) {
        console.log('✅ Using voice:', russianVoice.name, russianVoice.lang, 'localService:', russianVoice.localService);
        utterance.voice = russianVoice;
      } else {
        console.warn('⚠️ No Russian voice found, using default voice');
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang}) local:${v.localService}`));
        // Use first voice as fallback
        if (voices.length > 0) {
          utterance.voice = voices[0];
        }
      }

      utterance.onstart = () => {
        console.log('✅ Speech started');
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        console.log('✅ Speech ended');
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event.error, event);
        setIsSpeaking(false);
      };

      utterance.onpause = () => {
        console.log('⏸️ Speech paused');
      };

      utterance.onresume = () => {
        console.log('▶️ Speech resumed');
      };

      console.log('🔊 Starting speech synthesis with text:', text.substring(0, 50) + '...');
      console.log('🔊 speechSynthesis.speaking:', window.speechSynthesis.speaking);
      console.log('🔊 speechSynthesis.pending:', window.speechSynthesis.pending);
      console.log('🔊 speechSynthesis.paused:', window.speechSynthesis.paused);

      try {
        window.speechSynthesis.speak(utterance);
        console.log('🔊 speak() called successfully');

        // Check status after a short delay
        setTimeout(() => {
          console.log('🔊 After 100ms - speaking:', window.speechSynthesis.speaking, 'pending:', window.speechSynthesis.pending);
        }, 100);
      } catch (error) {
        console.error('❌ Error calling speak():', error);
      }
    };

    // If voices are already loaded, speak immediately
    if (voicesLoadedRef.current || window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      // Wait for voices to load
      console.log('Waiting for voices to load...');
      const handleVoicesLoaded = () => {
        console.log('Voices loaded, speaking now');
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesLoaded);
        voicesLoadedRef.current = true;
        doSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesLoaded);

      // Fallback: try speaking after a short delay even if voices don't load
      setTimeout(() => {
        if (!voicesLoadedRef.current) {
          console.log('Timeout reached, attempting to speak anyway');
          window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesLoaded);
          doSpeak();
        }
      }, 1000);
    }
  }, []);

  return (
    <div className="cyber-card p-8">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
        🎤 Голосовой ассистент
        {useDeepgram && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            Deepgram
          </span>
        )}
      </h2>

      {/* Microphone Button */}
      <div className="flex flex-col items-center justify-center mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 ${
            isProcessing
              ? 'bg-gradient-to-br from-yellow-500 to-orange-600 animate-pulse shadow-2xl shadow-yellow-500/50 cursor-wait'
              : isListening
                ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse shadow-2xl shadow-red-500/50'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:scale-110 shadow-xl shadow-cyan-500/50'
          }`}
        >
          {isProcessing ? '⏳' : isListening ? '⏹️' : '🎤'}
        </button>

        <p className="mt-4 text-sm text-gray-400">
          {isProcessing
            ? 'Обрабатываю...'
            : isListening
              ? 'Слушаю... (говорите)'
              : 'Нажмите, чтобы начать'}
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

      {/* Current Transcript (Final) */}
      {transcript && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-400">Вы сказали:</p>
            {confidence !== null && (
              <span className="text-xs text-green-400">
                Точность: {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
          <p className="text-lg">{transcript}</p>
        </div>
      )}

      {/* Interim Transcript (Real-time) */}
      {interimTranscript && !transcript && (
        <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-400 mb-1">Распознаю...</p>
          <p className="text-lg text-gray-300 italic">{interimTranscript}</p>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            <p className="text-sm text-yellow-400">Анализирую с помощью AI...</p>
          </div>
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

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mt-4">
          <div className="flex items-start gap-2">
            <span className="text-red-400">⚠️</span>
            <div>
              <p className="text-sm text-red-400">{errorMessage}</p>
              {permissionStatus === 'denied' && (
                <button
                  onClick={requestMicrophonePermission}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline"
                >
                  Попробовать снова
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info about current recognition method */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          {useDeepgram
            ? '🔊 Используется Deepgram Nova-2 для распознавания речи (~95% точность)'
            : '🔊 Используется Web Speech API для распознавания речи'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          🤖 Обработка симптомов: Ollama + Qwen (локально)
        </p>
      </div>

      {/* Test TTS Buttons - for debugging */}
      <div className="mt-4 text-center">
        <div className="flex gap-2 justify-center mb-2">
          <button
            onClick={() => {
              console.log('🧪 Russian test button clicked');
              speakText('Проверка озвучки. Это тестовое сообщение на русском языке.');
            }}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
          >
            🧪 Тест (RU)
          </button>
          <button
            onClick={() => {
              console.log('🧪 English test button clicked');
              const utterance = new SpeechSynthesisUtterance('Hello! This is a test message in English.');
              utterance.lang = 'en-US';
              utterance.rate = 1.0;
              const voices = window.speechSynthesis.getVoices();
              const englishVoice = voices.find(v => v.lang.startsWith('en') && v.localService);
              if (englishVoice) {
                utterance.voice = englishVoice;
                console.log('Using English voice:', englishVoice.name, 'local:', englishVoice.localService);
              }
              utterance.onstart = () => console.log('✅ English speech started');
              utterance.onend = () => console.log('✅ English speech ended');
              utterance.onerror = (e) => console.error('❌ English speech error:', e.error);
              window.speechSynthesis.speak(utterance);
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
          >
            🧪 Тест (EN)
          </button>
          <button
            onClick={() => {
              const voices = window.speechSynthesis.getVoices();
              console.log('📋 All available voices:');
              console.table(voices.map(v => ({
                name: v.name,
                lang: v.lang,
                local: v.localService,
                default: v.default
              })));
            }}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            📋 Показать голоса
          </button>
        </div>
      </div>
    </div>
  );
}
