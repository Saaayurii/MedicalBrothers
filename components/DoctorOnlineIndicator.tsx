'use client';

import { useEffect } from 'react';

export function DoctorHeartbeat() {
  useEffect(() => {
    // Send heartbeat every 30 seconds to maintain online status
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/doctors/heartbeat', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    // Send immediately on mount
    sendHeartbeat();

    // Then send every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function OnlineIndicator({ isOnline, size = 'md', showText = true }: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${sizeClasses[size]} rounded-full ${
          isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
        }`}
        title={isOnline ? 'Онлайн' : 'Оффлайн'}
      />
      {showText && (
        <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
          {isOnline ? 'Онлайн' : 'Оффлайн'}
        </span>
      )}
    </div>
  );
}
