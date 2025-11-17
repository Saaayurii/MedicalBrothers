'use client';

import { useEffect, useRef, useState } from 'react';
import { WebRTCManager } from '@/lib/webrtc';
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
  const [webrtc] = useState(() => new WebRTCManager());
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Initialize local stream
      const stream = await webrtc.initializeLocalStream();

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      webrtc.createPeerConnection({
        onIceCandidate: (candidate) => {
          // TODO: Send to signaling server
          logger.debug('ICE candidate generated', { candidate });
        },
        onTrack: (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          if (state === 'connected') {
            setIsConnected(true);
            analytics.trackVideoConsultation('join');
          } else if (state === 'disconnected' || state === 'failed') {
            setIsConnected(false);
          }
        },
      });

      // TODO: Create offer and send to signaling server
      // const offer = await webrtc.createOffer();
      // sendToSignalingServer({ type: 'offer', offer });

      logger.info('Video call initialized', { roomId, userId });
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to initialize call', error);
      setError(error.message);
    }
  };

  const cleanup = () => {
    analytics.trackVideoConsultation('end');
    webrtc.cleanup();
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    webrtc.toggleVideo(newState);
    setIsVideoEnabled(newState);
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    webrtc.toggleAudio(newState);
    setIsAudioEnabled(newState);
  };

  const handleLeave = () => {
    cleanup();
    if (onLeave) {
      onLeave();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleLeave}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Leave Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Video Consultation</h1>
          <p className="text-sm text-gray-400">Room: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-sm text-gray-400">
            {connectionState === 'connected'
              ? 'Connected'
              : connectionState === 'connecting'
              ? 'Connecting...'
              : 'Waiting'}
          </span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Remote Video (Main) */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="text-6xl mb-4">👨‍⚕️</div>
                <p className="text-gray-400">Waiting for doctor to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden md:absolute md:bottom-20 md:right-8 md:w-64 md:h-48">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-sm text-white">
            You
          </div>
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <span className="text-4xl">📷</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-center gap-4">
        {/* Microphone Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-4 rounded-full transition-colors ${
            isAudioEnabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          <span className="text-2xl">{isAudioEnabled ? '🎤' : '🔇'}</span>
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-colors ${
            isVideoEnabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
          title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
        >
          <span className="text-2xl">{isVideoEnabled ? '📹' : '📷'}</span>
        </button>

        {/* Leave Button */}
        <button
          onClick={handleLeave}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="Leave Call"
        >
          <span className="text-2xl">📞</span>
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
