/**
 * WebRTC Library for Video Consultations
 * Handles peer-to-peer video/audio connections
 */

import { logger } from './logger';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export interface PeerConnectionCallbacks {
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
}

// Default STUN servers (can be replaced with TURN servers for production)
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * WebRTC Manager Class
 */
export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private config: WebRTCConfig;
  private callbacks: PeerConnectionCallbacks = {};

  constructor(config?: Partial<WebRTCConfig>) {
    this.config = {
      iceServers: config?.iceServers || DEFAULT_ICE_SERVERS,
    };
  }

  /**
   * Initialize local media stream (camera + microphone)
   */
  async initializeLocalStream(constraints?: MediaConstraints): Promise<MediaStream> {
    try {
      const defaultConstraints: MediaConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      const finalConstraints = constraints || defaultConstraints;

      this.localStream = await navigator.mediaDevices.getUserMedia(finalConstraints);

      logger.info('Local media stream initialized', {
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length,
      });

      return this.localStream;
    } catch (error) {
      logger.error('Failed to initialize local stream', error as Error);
      throw error;
    }
  }

  /**
   * Create peer connection
   */
  createPeerConnection(callbacks: PeerConnectionCallbacks): RTCPeerConnection {
    if (this.peerConnection) {
      logger.warn('Peer connection already exists, closing previous connection');
      this.closePeerConnection();
    }

    this.callbacks = callbacks;
    this.peerConnection = new RTCPeerConnection(this.config);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callbacks.onIceCandidate) {
        this.callbacks.onIceCandidate(event.candidate);
        logger.debug('ICE candidate generated');
      }
    };

    // Handle incoming tracks (remote stream)
    this.peerConnection.ontrack = (event) => {
      if (this.callbacks.onTrack) {
        this.callbacks.onTrack(event);
        logger.info('Remote track received', { kind: event.track.kind });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state && this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(state);
        logger.info('Connection state changed', { state });
      }
    };

    // Handle data channel
    this.peerConnection.ondatachannel = (event) => {
      if (this.callbacks.onDataChannel) {
        this.callbacks.onDataChannel(event.channel);
        logger.info('Data channel received');
      }
    };

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
      logger.info('Local tracks added to peer connection');
    }

    logger.info('Peer connection created');
    return this.peerConnection;
  }

  /**
   * Create offer (caller side)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);

      logger.info('Offer created and set as local description');
      return offer;
    } catch (error) {
      logger.error('Failed to create offer', error as Error);
      throw error;
    }
  }

  /**
   * Create answer (callee side)
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      logger.info('Answer created and set as local description');
      return answer;
    } catch (error) {
      logger.error('Failed to create answer', error as Error);
      throw error;
    }
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
      logger.info('Remote description set', { type: description.type });
    } catch (error) {
      logger.error('Failed to set remote description', error as Error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      logger.debug('ICE candidate added');
    } catch (error) {
      logger.error('Failed to add ICE candidate', error as Error);
      throw error;
    }
  }

  /**
   * Create data channel for text chat
   */
  createDataChannel(label: string = 'chat'): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.dataChannel = this.peerConnection.createDataChannel(label);

    this.dataChannel.onopen = () => {
      logger.info('Data channel opened');
    };

    this.dataChannel.onclose = () => {
      logger.info('Data channel closed');
    };

    return this.dataChannel;
  }

  /**
   * Send message via data channel
   */
  sendMessage(message: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not open');
    }

    this.dataChannel.send(message);
    logger.debug('Message sent via data channel');
  }

  /**
   * Toggle video track
   */
  toggleVideo(enabled: boolean): void {
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });

    logger.info('Video toggled', { enabled });
  }

  /**
   * Toggle audio track
   */
  toggleAudio(enabled: boolean): void {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });

    logger.info('Audio toggled', { enabled });
  }

  /**
   * Get connection stats
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null;

    try {
      const stats = await this.peerConnection.getStats();
      return stats;
    } catch (error) {
      logger.error('Failed to get stats', error as Error);
      return null;
    }
  }

  /**
   * Close peer connection
   */
  closePeerConnection(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      logger.info('Peer connection closed');
    }
  }

  /**
   * Stop local stream
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
      logger.info('Local stream stopped');
    }
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    this.closePeerConnection();
    this.stopLocalStream();
    logger.info('WebRTC manager cleaned up');
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get peer connection
   */
  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  /**
   * Check if WebRTC is supported
   */
  static isSupported(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof window !== 'undefined' &&
      window.RTCPeerConnection
    );
  }
}

/**
 * Helper function to check microphone/camera permissions
 */
export async function checkMediaPermissions(): Promise<{
  camera: boolean;
  microphone: boolean;
}> {
  const result = { camera: false, microphone: false };

  try {
    if (!navigator.permissions) {
      return result;
    }

    const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });

    result.camera = cameraPermission.state === 'granted';
    result.microphone = micPermission.state === 'granted';
  } catch (error) {
    logger.warn('Could not check media permissions', error as Error);
  }

  return result;
}

/**
 * Get available media devices
 */
export async function getMediaDevices(): Promise<{
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    return {
      cameras: devices.filter((d) => d.kind === 'videoinput'),
      microphones: devices.filter((d) => d.kind === 'audioinput'),
      speakers: devices.filter((d) => d.kind === 'audiooutput'),
    };
  } catch (error) {
    logger.error('Failed to enumerate devices', error as Error);
    return { cameras: [], microphones: [], speakers: [] };
  }
}
