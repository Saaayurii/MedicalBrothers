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

    // Check microphone permission
    checkMicrophonePermission();

    return () => {
      cleanup();
    };
  }, []);

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
            if (data.error.includes('API key not configured')) {
              // Fallback to Web Speech API if Deepgram not configured
              setErrorMessage('Deepgram не настроен. Используется альтернативный метод.');
              setUseDeepgram(false);
              setInterimTranscript('');
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
          setErrorMessage('Ошибка сети. Переключаюсь на альтернативный метод.');
          setUseDeepgram(false);
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

      // Speak response using built-in TTS
      speakText(response);
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте ещё раз.'
      };
      setMessages(prev => [...prev, errorMsg]);
    }

    setTranscript('');
    setInterimTranscript('');
    lastTranscriptRef.current = '';
    setIsProcessing(false);
  };

  // Built-in Text-to-Speech using Web Speech API
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Try to find a Russian voice
      const voices = window.speechSynthesis.getVoices();
      const russianVoice = voices.find(voice =>
        voice.lang.startsWith('ru') || voice.name.toLowerCase().includes('russian')
      );
      if (russianVoice) {
        utterance.voice = russianVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
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
    </div>
  );
}
