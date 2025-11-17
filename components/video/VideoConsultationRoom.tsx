'use client';

import { useEffect, useRef, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { logger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

interface VideoConsultationRoomProps {
  roomId: string;
  userId: string;
  userName: string;
  onLeave?: () => void;
}

export default function VideoConsultationRoom({
  roomId,
  userId,
  userName,
  onLeave,
}: VideoConsultationRoomProps) {
  const { socket, isConnected: isSocketConnected } = useSocket();
  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isConnected,
    initializeMedia,
    startCall,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC({ socket, roomId, userId, userName });

  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize media on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initializeMedia();
        setIsInitialized(true);
        logger.info('Video call initialized', { roomId, userId });
      } catch (err) {
        const error = err as Error;
        logger.error('Failed to initialize call', error);
        setError(error.message);
      }
    };

    init();
  }, [initializeMedia, roomId, userId]);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Track analytics
  useEffect(() => {
    if (isConnected) {
      analytics.trackVideoConsultation('join');
    }
    return () => {
      if (isConnected) {
        analytics.trackVideoConsultation('end');
      }
    };
  }, [isConnected]);

  const handleLeave = () => {
    endCall();
    if (onLeave) {
      onLeave();
    }
  };

  const handleStartCall = () => {
    startCall();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Ошибка подключения</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleLeave}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Покинуть комнату
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">Видеоконсультация</h1>
          <p className="text-xs sm:text-sm text-gray-400">Комната: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : isSocketConnected ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs sm:text-sm text-gray-400">
            {isConnected ? 'Подключено' : isSocketConnected ? 'Ожидание...' : 'Отключено'}
          </span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-2 sm:p-4 relative">
        {/* Remote Video (Main) */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="text-4xl sm:text-6xl mb-4">👨‍⚕️</div>
                <p className="text-sm sm:text-base text-gray-400">
                  {isSocketConnected ? 'Ожидание собеседника...' : 'Подключение к серверу...'}
                </p>
                {isSocketConnected && isInitialized && !isConnected && (
                  <button
                    onClick={handleStartCall}
                    className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Начать звонок
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-20 right-4 sm:right-8 w-32 h-24 sm:w-64 sm:h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black bg-opacity-50 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm text-white">
            Вы
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <span className="text-2xl sm:text-4xl">📷</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-2 sm:gap-4">
        {/* Microphone Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-3 sm:p-4 rounded-full transition-colors ${
            isAudioEnabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
        >
          <span className="text-xl sm:text-2xl">{isAudioEnabled ? '🎤' : '🔇'}</span>
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-3 sm:p-4 rounded-full transition-colors ${
            isVideoEnabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isVideoEnabled ? 'Выключить камеру' : 'Включить камеру'}
        >
          <span className="text-xl sm:text-2xl">{isVideoEnabled ? '📹' : '📷'}</span>
        </button>

        {/* Leave Button */}
        <button
          onClick={handleLeave}
          className="p-3 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="Завершить звонок"
        >
          <span className="text-xl sm:text-2xl">📞</span>
        </button>
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
