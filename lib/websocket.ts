/**
 * WebSocket Library for Real-Time Communication
 * Supports native WebSocket and Pusher/Ably integration
 */

import { logger } from './logger';

export type MessageType =
  | 'text'
  | 'system'
  | 'typing'
  | 'file'
  | 'appointment-update'
  | 'notification';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  roomId: string;
  metadata?: Record<string, any>;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  isTyping: boolean;
}

export interface WebSocketConfig {
  provider: 'native' | 'pusher' | 'ably';
  url?: string;
  pusher?: {
    appKey: string;
    cluster: string;
  };
  ably?: {
    apiKey: string;
  };
}

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (indicator: TypingIndicator) => void;
  onError?: (error: Error) => void;
  onUserJoined?: (userId: string, userName: string) => void;
  onUserLeft?: (userId: string) => void;
}

/**
 * WebSocket Manager Class
 */
export class WebSocketManager {
  private config: WebSocketConfig;
  private callbacks: WebSocketCallbacks = {};
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private currentRoom: string | null = null;
  private currentUserId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // For Pusher/Ably
  private pusher: any = null;
  private ably: any = null;
  private channel: any = null;

  constructor(config: WebSocketConfig, callbacks?: WebSocketCallbacks) {
    this.config = config;
    this.callbacks = callbacks || {};
  }

  /**
   * Connect to WebSocket server
   */
  async connect(userId: string, userName: string): Promise<void> {
    this.currentUserId = userId;

    try {
      if (this.config.provider === 'pusher') {
        await this.connectPusher();
      } else if (this.config.provider === 'ably') {
        await this.connectAbly();
      } else {
        await this.connectNative();
      }

      logger.info('WebSocket connected', { provider: this.config.provider, userId });
    } catch (error) {
      logger.error('Failed to connect to WebSocket', error as Error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error);
      }
      throw error;
    }
  }

  /**
   * Connect using native WebSocket
   */
  private async connectNative(): Promise<void> {
    if (!this.config.url) {
      throw new Error('WebSocket URL is required for native provider');
    }

    this.ws = new WebSocket(this.config.url);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();

      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }

      logger.info('Native WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        logger.error('Failed to parse WebSocket message', error as Error);
      }
    };

    this.ws.onerror = (error) => {
      logger.error('WebSocket error', error as any);
      if (this.callbacks.onError) {
        this.callbacks.onError(new Error('WebSocket connection error'));
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.stopHeartbeat();

      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }

      logger.warn('WebSocket disconnected, attempting to reconnect...');
      this.attemptReconnect();
    };
  }

  /**
   * Connect using Pusher
   */
  private async connectPusher(): Promise<void> {
    if (!this.config.pusher) {
      throw new Error('Pusher configuration is required');
    }

    try {
      // TODO: Import Pusher
      // import Pusher from 'pusher-js';
      //
      // this.pusher = new Pusher(this.config.pusher.appKey, {
      //   cluster: this.config.pusher.cluster,
      // });
      //
      // this.pusher.connection.bind('connected', () => {
      //   this.isConnected = true;
      //   if (this.callbacks.onConnect) {
      //     this.callbacks.onConnect();
      //   }
      // });

      logger.info('Pusher connected (simulated)');
      this.isConnected = true;

      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    } catch (error) {
      logger.error('Failed to connect to Pusher', error as Error);
      throw error;
    }
  }

  /**
   * Connect using Ably
   */
  private async connectAbly(): Promise<void> {
    if (!this.config.ably) {
      throw new Error('Ably configuration is required');
    }

    try {
      // TODO: Import Ably
      // import * as Ably from 'ably';
      //
      // this.ably = new Ably.Realtime(this.config.ably.apiKey);
      //
      // this.ably.connection.on('connected', () => {
      //   this.isConnected = true;
      //   if (this.callbacks.onConnect) {
      //     this.callbacks.onConnect();
      //   }
      // });

      logger.info('Ably connected (simulated)');
      this.isConnected = true;

      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    } catch (error) {
      logger.error('Failed to connect to Ably', error as Error);
      throw error;
    }
  }

  /**
   * Join a chat room
   */
  joinRoom(roomId: string): void {
    this.currentRoom = roomId;

    if (this.config.provider === 'native' && this.ws && this.isConnected) {
      this.ws.send(
        JSON.stringify({
          type: 'join-room',
          roomId,
          userId: this.currentUserId,
        })
      );
    } else if (this.config.provider === 'pusher' && this.pusher) {
      this.channel = this.pusher.subscribe(`room-${roomId}`);
      this.bindPusherEvents();
    } else if (this.config.provider === 'ably' && this.ably) {
      this.channel = this.ably.channels.get(`room-${roomId}`);
      this.bindAblyEvents();
    }

    logger.info('Joined room', { roomId });
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (!this.currentRoom) return;

    if (this.config.provider === 'native' && this.ws && this.isConnected) {
      this.ws.send(
        JSON.stringify({
          type: 'leave-room',
          roomId: this.currentRoom,
          userId: this.currentUserId,
        })
      );
    } else if (this.config.provider === 'pusher' && this.channel) {
      this.pusher.unsubscribe(`room-${this.currentRoom}`);
      this.channel = null;
    } else if (this.config.provider === 'ably' && this.channel) {
      this.channel.detach();
      this.channel = null;
    }

    logger.info('Left room', { roomId: this.currentRoom });
    this.currentRoom = null;
  }

  /**
   * Send message
   */
  sendMessage(content: string, type: MessageType = 'text'): void {
    if (!this.isConnected || !this.currentRoom) {
      throw new Error('Not connected to a room');
    }

    const message: ChatMessage = {
      id: this.generateMessageId(),
      type,
      content,
      senderId: this.currentUserId!,
      senderName: '', // Will be filled by server
      timestamp: Date.now(),
      roomId: this.currentRoom,
    };

    if (this.config.provider === 'native' && this.ws) {
      this.ws.send(JSON.stringify({ type: 'message', data: message }));
    } else if (this.config.provider === 'pusher' && this.channel) {
      this.channel.trigger('client-message', message);
    } else if (this.config.provider === 'ably' && this.channel) {
      this.channel.publish('message', message);
    }

    logger.debug('Message sent', { messageId: message.id });
  }

  /**
   * Send typing indicator
   */
  sendTyping(isTyping: boolean): void {
    if (!this.isConnected || !this.currentRoom) return;

    const indicator: TypingIndicator = {
      userId: this.currentUserId!,
      userName: '', // Will be filled by server
      roomId: this.currentRoom,
      isTyping,
    };

    if (this.config.provider === 'native' && this.ws) {
      this.ws.send(JSON.stringify({ type: 'typing', data: indicator }));
    } else if (this.config.provider === 'pusher' && this.channel) {
      this.channel.trigger('client-typing', indicator);
    } else if (this.config.provider === 'ably' && this.channel) {
      this.channel.publish('typing', indicator);
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'message':
        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(data.data as ChatMessage);
        }
        break;

      case 'typing':
        if (this.callbacks.onTyping) {
          this.callbacks.onTyping(data.data as TypingIndicator);
        }
        break;

      case 'user-joined':
        if (this.callbacks.onUserJoined) {
          this.callbacks.onUserJoined(data.userId, data.userName);
        }
        break;

      case 'user-left':
        if (this.callbacks.onUserLeft) {
          this.callbacks.onUserLeft(data.userId);
        }
        break;

      default:
        logger.warn('Unknown message type', { type: data.type });
    }
  }

  /**
   * Bind Pusher events
   */
  private bindPusherEvents(): void {
    if (!this.channel) return;

    this.channel.bind('message', (data: ChatMessage) => {
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(data);
      }
    });

    this.channel.bind('typing', (data: TypingIndicator) => {
      if (this.callbacks.onTyping) {
        this.callbacks.onTyping(data);
      }
    });

    this.channel.bind('pusher:member_added', (member: any) => {
      if (this.callbacks.onUserJoined) {
        this.callbacks.onUserJoined(member.id, member.info.name);
      }
    });

    this.channel.bind('pusher:member_removed', (member: any) => {
      if (this.callbacks.onUserLeft) {
        this.callbacks.onUserLeft(member.id);
      }
    });
  }

  /**
   * Bind Ably events
   */
  private bindAblyEvents(): void {
    if (!this.channel) return;

    this.channel.subscribe('message', (msg: any) => {
      if (this.callbacks.onMessage) {
        this.callbacks.onMessage(msg.data);
      }
    });

    this.channel.subscribe('typing', (msg: any) => {
      if (this.callbacks.onTyping) {
        this.callbacks.onTyping(msg.data);
      }
    });

    this.channel.presence.subscribe('enter', (member: any) => {
      if (this.callbacks.onUserJoined) {
        this.callbacks.onUserJoined(member.clientId, member.data.name);
      }
    });

    this.channel.presence.subscribe('leave', (member: any) => {
      if (this.callbacks.onUserLeft) {
        this.callbacks.onUserLeft(member.clientId);
      }
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      logger.info('Attempting to reconnect...', { attempt: this.reconnectAttempts });
      if (this.currentUserId) {
        this.connect(this.currentUserId, '');
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.currentRoom) {
      this.leaveRoom();
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }

    if (this.ably) {
      this.ably.close();
      this.ably = null;
    }

    this.isConnected = false;
    logger.info('WebSocket disconnected');
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if connected
   */
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current room
   */
  getCurrentRoom(): string | null {
    return this.currentRoom;
  }
}

/**
 * Create WebSocket client
 */
export function createWebSocketClient(
  config: WebSocketConfig,
  callbacks?: WebSocketCallbacks
): WebSocketManager {
  return new WebSocketManager(config, callbacks);
}
