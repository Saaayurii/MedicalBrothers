'use client';

import { useEffect, useRef, useState } from 'react';
import { createWebSocketClient, ChatMessage, TypingIndicator } from '@/lib/websocket';
import { logger } from '@/lib/logger';

interface ChatRoomProps {
  roomId: string;
  userId: string;
  userName: string;
  wsUrl?: string;
}

export default function ChatRoom({ roomId, userId, userName, wsUrl }: ChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const wsRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null);

  useEffect(() => {
    initializeWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeWebSocket = async () => {
    const ws = createWebSocketClient(
      {
        provider: 'native',
        url: wsUrl || 'ws://localhost:3000/ws',
      },
      {
        onConnect: () => {
          setIsConnected(true);
          logger.info('Chat connected');
        },
        onDisconnect: () => {
          setIsConnected(false);
          logger.warn('Chat disconnected');
        },
        onMessage: (message) => {
          setMessages((prev) => [...prev, message]);
        },
        onTyping: (indicator) => {
          handleTypingIndicator(indicator);
        },
        onUserJoined: (userId, userName) => {
          setOnlineUsers((prev) => new Set([...prev, userId]));
          addSystemMessage(`${userName} joined the chat`);
        },
        onUserLeft: (userId) => {
          setOnlineUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(userId);
            return updated;
          });
        },
        onError: (error) => {
          logger.error('Chat error', error);
        },
      }
    );

    wsRef.current = ws;

    try {
      await ws.connect(userId, userName);
      ws.joinRoom(roomId);
    } catch (error) {
      logger.error('Failed to connect to chat', error as Error);
    }
  };

  const handleTypingIndicator = (indicator: TypingIndicator) => {
    if (indicator.userId === userId) return;

    setTypingUsers((prev) => {
      const updated = new Set(prev);
      if (indicator.isTyping) {
        updated.add(indicator.userName);
      } else {
        updated.delete(indicator.userName);
      }
      return updated;
    });
  };

  const addSystemMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'system',
        content,
        senderId: 'system',
        senderName: 'System',
        timestamp: Date.now(),
        roomId,
      },
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !wsRef.current || !isConnected) return;

    wsRef.current.sendMessage(inputValue.trim());
    setInputValue('');

    // Stop typing indicator
    wsRef.current.sendTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (!wsRef.current || !isConnected) return;

    // Send typing indicator
    wsRef.current.sendTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      wsRef.current?.sendTyping(false);
    }, 3000);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat Room</h2>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        {onlineUsers.size > 0 && (
          <p className="text-xs text-blue-100 mt-1">
            {onlineUsers.size} user{onlineUsers.size > 1 ? 's' : ''} online
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isOwn = message.senderId === userId;
          const isSystem = message.type === 'system';

          if (isSystem) {
            return (
              <div key={message.id} className="text-center">
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {message.content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                {!isOwn && (
                  <p className="text-xs text-gray-600 mb-1 px-1">
                    {message.senderName}
                  </p>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-600">
                {Array.from(typingUsers).join(', ')} {typingUsers.size > 1 ? 'are' : 'is'} typing
                <span className="typing-dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputValue.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>

      <style jsx>{`
        .typing-dots span {
          animation: blink 1.4s infinite;
          animation-fill-mode: both;
        }
        .typing-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes blink {
          0%, 60%, 100% {
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
