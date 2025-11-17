'use client';

import { useEffect, useState, useCallback } from 'react';

interface UsePushNotificationsOptions {
  userId: string;
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;
}

export function usePushNotifications({ userId, onSubscriptionChange }: UsePushNotificationsOptions) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsSupported(false);
      setIsLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      setSubscription(existingSubscription);
      setIsSubscribed(!!existingSubscription);
      setIsLoading(false);

      if (onSubscriptionChange) {
        onSubscriptionChange(existingSubscription);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError('Failed to check subscription status');
      setIsLoading(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setError('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Register service worker
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // Get VAPID public key from server
      const response = await fetch('/api/push/subscribe');
      const { publicKey } = await response.json();

      if (!publicKey) {
        throw new Error('VAPID public key not available');
      }

      // Subscribe to push notifications
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription: {
            endpoint: newSubscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')!),
              auth: arrayBufferToBase64(newSubscription.getKey('auth')!),
            },
          },
        }),
      });

      setSubscription(newSubscription);
      setIsSubscribed(true);
      setIsLoading(false);

      if (onSubscriptionChange) {
        onSubscriptionChange(newSubscription);
      }

      return true;
    } catch (err: any) {
      console.error('Error subscribing to push notifications:', err);
      setError(err.message || 'Failed to subscribe');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, userId, onSubscriptionChange]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Unsubscribe from push notifications
      await subscription.unsubscribe();

      // Notify server
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          endpoint: subscription.endpoint,
        }),
      });

      setSubscription(null);
      setIsSubscribed(false);
      setIsLoading(false);

      if (onSubscriptionChange) {
        onSubscriptionChange(null);
      }

      return true;
    } catch (err: any) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err.message || 'Failed to unsubscribe');
      setIsLoading(false);
      return false;
    }
  }, [subscription, userId, onSubscriptionChange]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
