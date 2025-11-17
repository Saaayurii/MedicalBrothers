import webpush from 'web-push';

// VAPID keys should be generated once and stored as environment variables
// To generate: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@medicalbrothers.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushSubscription {
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
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  try {
    const payloadString = JSON.stringify(payload);

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      payloadString
    );

    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export async function sendBulkNotifications(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<{ success: number; failed: number }> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  const success = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { success, failed };
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

// Notification templates
export const NotificationTemplates = {
  appointmentReminder: (doctorName: string, time: string): NotificationPayload => ({
    title: 'Напоминание о приёме',
    body: `Ваша консультация с ${doctorName} начнётся в ${time}`,
    icon: '/icons/appointment.png',
    badge: '/icons/badge.png',
    tag: 'appointment-reminder',
    requireInteraction: true,
    data: {
      type: 'appointment',
      action: 'open-appointment',
    },
  }),

  newMessage: (from: string, preview: string): NotificationPayload => ({
    title: `Новое сообщение от ${from}`,
    body: preview,
    icon: '/icons/message.png',
    badge: '/icons/badge.png',
    tag: 'new-message',
    data: {
      type: 'message',
      action: 'open-chat',
    },
  }),

  consultationReady: (doctorName: string): NotificationPayload => ({
    title: 'Врач готов к консультации',
    body: `${doctorName} ожидает вас в видеокомнате`,
    icon: '/icons/video.png',
    badge: '/icons/badge.png',
    tag: 'consultation-ready',
    requireInteraction: true,
    data: {
      type: 'video-call',
      action: 'join-call',
    },
  }),

  prescriptionReady: (): NotificationPayload => ({
    title: 'Рецепт готов',
    body: 'Ваш врач выписал новый рецепт',
    icon: '/icons/prescription.png',
    badge: '/icons/badge.png',
    tag: 'prescription',
    data: {
      type: 'prescription',
      action: 'view-prescription',
    },
  }),
};
