import { notificationEmitter } from '@/lib/events/notification-emitter';
import { Notification } from '@/lib/types/notification';

export async function notifyAppointmentCreated(
  patientId: number,
  doctorId: number,
  appointmentDate: Date,
  appointmentTime: string,
  doctorName: string
) {
  // Notify patient
  const patientNotification: Notification = {
    id: `appt_${Date.now()}_patient`,
    type: 'appointment',
    title: '✅ Запись успешно создана!',
    message: `Вы записаны к врачу ${doctorName} на ${appointmentDate.toLocaleDateString('ru-RU')} в ${appointmentTime}`,
    userId: patientId,
    userRole: 'patient',
    data: { doctorId, appointmentDate, appointmentTime },
    timestamp: new Date(),
  };

  notificationEmitter.emitNotification(patientNotification);

  // Notify doctor (if doctor has admin account linked)
  const doctorNotification: Notification = {
    id: `appt_${Date.now()}_doctor`,
    type: 'appointment',
    title: '📅 Новая запись',
    message: `Новая запись на ${appointmentDate.toLocaleDateString('ru-RU')} в ${appointmentTime}`,
    userId: doctorId,
    userRole: 'doctor',
    data: { patientId, appointmentDate, appointmentTime },
    timestamp: new Date(),
  };

  notificationEmitter.emitNotification(doctorNotification);
}

export async function notifyAppointmentReminder(
  patientId: number,
  doctorName: string,
  appointmentDate: Date,
  appointmentTime: string
) {
  const notification: Notification = {
    id: `reminder_${Date.now()}`,
    type: 'reminder',
    title: '⏰ Напоминание о записи',
    message: `Не забудьте о записи к врачу ${doctorName} завтра в ${appointmentTime}`,
    userId: patientId,
    userRole: 'patient',
    data: { doctorName, appointmentDate, appointmentTime },
    timestamp: new Date(),
  };

  notificationEmitter.emitNotification(notification);
}

export async function notifyEmergencyCall(
  patientName: string,
  severity: string,
  symptoms: string
) {
  // Notify all admins about emergency
  const notification: Notification = {
    id: `emergency_${Date.now()}`,
    type: 'emergency',
    title: '🚨 Экстренный вызов!',
    message: `${patientName} - ${severity}. Симптомы: ${symptoms}`,
    userId: 0, // Broadcast to all admins
    userRole: 'admin',
    data: { patientName, severity, symptoms },
    timestamp: new Date(),
  };

  notificationEmitter.emitNotification(notification);
}
