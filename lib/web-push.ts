/**
 * Web Push Notifications Library
 * Handles push notification subscriptions and sending
 */

import { logger } from './logger';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current push notification permission
 */
export function getPushPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  logger.info('Push permission requested', { permission });

  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscriptionData> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  // Request permission first
  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    throw new Error('Push notification permission denied');
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;

  // Check for existing subscription
  let subscription = await registration.pushManager.getSubscription();

  // Create new subscription if none exists
  if (!subscription) {
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as BufferSource,
    });
  }

  const subscriptionData = subscriptionToData(subscription);
  logger.info('Push subscription created', { endpoint: subscriptionData.endpoint });

  return subscriptionData;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const success = await subscription.unsubscribe();
      logger.info('Push subscription removed', { success });
      return success;
    }

    return false;
  } catch (error) {
    logger.error('Failed to unsubscribe from push', error as Error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return subscriptionToData(subscription);
    }

    return null;
  } catch (error) {
    logger.error('Failed to get push subscription', error as Error);
    return null;
  }
}

/**
 * Send push subscription to server
 */
export async function savePushSubscription(
  subscription: PushSubscriptionData
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error('Failed to save push subscription');
    }

    logger.info('Push subscription saved to server');
    return true;
  } catch (error) {
    logger.error('Failed to save push subscription', error as Error);
    return false;
  }
}

/**
 * Remove push subscription from server
 */
export async function removePushSubscription(
  endpoint: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove push subscription');
    }

    logger.info('Push subscription removed from server');
    return true;
  } catch (error) {
    logger.error('Failed to remove push subscription', error as Error);
    return false;
  }
}

/**
 * Show a local notification (without push)
 */
export async function showNotification(
  title: string,
  options: NotificationOptions = {}
): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Notifications are not supported');
  }

  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    ...options,
  });
}

// Helper functions

/**
 * Convert URL-safe base64 string to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convert PushSubscription to data object
 */
function subscriptionToData(subscription: PushSubscription): PushSubscriptionData {
  const key = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: key ? arrayBufferToBase64(key) : '',
      auth: auth ? arrayBufferToBase64(auth) : '',
    },
  };
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
