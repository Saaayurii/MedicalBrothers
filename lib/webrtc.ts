// WebRTC configuration and utilities
export const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
};

export interface CallParticipant {
  id: string;
  name: string;
  role: 'patient' | 'doctor';
  stream?: MediaStream;
}

export interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate';
  from: string;
  to: string;
  data: any;
}

export async function getUserMedia(
  constraints: MediaStreamConstraints = {
    video: { width: 1280, height: 720 },
    audio: true,
  }
): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw new Error('Не удалось получить доступ к камере или микрофону');
  }
}

export async function getDisplayMedia(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 1920, height: 1080 },
      audio: false,
    });
    return stream;
  } catch (error) {
    console.error('Error accessing display media:', error);
    throw new Error('Не удалось получить доступ к демонстрации экрана');
  }
}

export function stopMediaStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

export function toggleAudio(stream: MediaStream | null): boolean {
  if (!stream) return false;
  const audioTrack = stream.getAudioTracks()[0];
  if (audioTrack) {
    audioTrack.enabled = !audioTrack.enabled;
    return audioTrack.enabled;
  }
  return false;
}

export function toggleVideo(stream: MediaStream | null): boolean {
  if (!stream) return false;
  const videoTrack = stream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.enabled = !videoTrack.enabled;
    return videoTrack.enabled;
  }
  return false;
}
