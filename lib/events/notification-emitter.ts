import { EventEmitter } from 'events';
import { Notification } from '@/lib/types/notification';

export type { Notification };

class NotificationEmitter extends EventEmitter {
  private static instance: NotificationEmitter;

  private constructor() {
    super();
    this.setMaxListeners(100); // Support many concurrent listeners
  }

  static getInstance(): NotificationEmitter {
    if (!NotificationEmitter.instance) {
      NotificationEmitter.instance = new NotificationEmitter();
    }
    return NotificationEmitter.instance;
  }

  emitNotification(notification: Notification) {
    const channel = `user:${notification.userId}:${notification.userRole}`;
    this.emit(channel, notification);

    // Also emit to role-based channel for admins
    if (notification.userRole === 'admin') {
      this.emit('admin:all', notification);
    }

    console.log(`📬 Notification emitted to ${channel}:`, notification.title);
  }

  subscribeUser(userId: number, userRole: string, callback: (notification: Notification) => void) {
    const channel = `user:${userId}:${userRole}`;
    this.on(channel, callback);
    return () => this.off(channel, callback);
  }

  subscribeAdmins(callback: (notification: Notification) => void) {
    this.on('admin:all', callback);
    return () => this.off('admin:all', callback);
  }
}

export const notificationEmitter = NotificationEmitter.getInstance();
