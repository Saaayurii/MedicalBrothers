import nodemailer from 'nodemailer';
import type { Appointment, Doctor, Patient } from '@prisma/client';

type AppointmentWithRelations = Appointment & {
  doctor: Doctor;
  patient: Patient | null;
};

// Создаём транспортер для отправки email
const createTransporter = () => {
  // В production используйте настоящий SMTP сервер
  // Для разработки можно использовать Ethereal Email (тестовый SMTP)
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback для development (логируем в консоль)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_USER || 'test@example.com',
      pass: process.env.ETHEREAL_PASS || 'testpassword',
    },
  });
};

// Отправка подтверждения записи пациенту
export async function sendAppointmentConfirmation(appointment: AppointmentWithRelations): Promise<boolean> {
  if (!appointment.patient?.email) {
    console.log('No patient email provided');
    return false;
  }

  try {
    const transporter = createTransporter();

    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });

    const appointmentTime = new Date(appointment.appointmentTime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const info = await transporter.sendMail({
      from: `"MedicalBrothers" <${process.env.SMTP_FROM || 'noreply@medicalbrothers.ru'}>`,
      to: appointment.patient.email,
      subject: '✅ Подтверждение записи на приём',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .info-box h3 { margin-top: 0; color: #667eea; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ваша запись подтверждена!</h1>
            </div>
            <div class="content">
              <p>Здравствуйте, ${appointment.patient.name}!</p>
              <p>Ваша запись на приём успешно подтверждена.</p>

              <div class="info-box">
                <h3>📋 Детали записи</h3>
                <p><strong>Врач:</strong> ${appointment.doctor.name}</p>
                <p><strong>Специальность:</strong> ${appointment.doctor.specialty}</p>
                <p><strong>Дата:</strong> ${appointmentDate}</p>
                <p><strong>Время:</strong> ${appointmentTime}</p>
                ${appointment.symptoms ? `<p><strong>Причина визита:</strong> ${appointment.symptoms}</p>` : ''}
              </div>

              <div class="info-box">
                <h3>ℹ️ Важная информация</h3>
                <ul>
                  <li>Пожалуйста, приходите за 10 минут до назначенного времени</li>
                  <li>При себе иметь паспорт и полис ОМС</li>
                  <li>Если вы не можете прийти, пожалуйста, отмените запись заранее</li>
                </ul>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/appointments" class="button">
                  Посмотреть мои записи
                </a>
              </p>

              <div class="footer">
                <p>С уважением,<br>Команда MedicalBrothers</p>
                <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Здравствуйте, ${appointment.patient.name}!

Ваша запись на приём успешно подтверждена.

Детали записи:
- Врач: ${appointment.doctor.name}
- Специальность: ${appointment.doctor.specialty}
- Дата: ${appointmentDate}
- Время: ${appointmentTime}
${appointment.symptoms ? `- Причина визита: ${appointment.symptoms}` : ''}

Пожалуйста, приходите за 10 минут до назначенного времени.
При себе иметь паспорт и полис ОМС.

С уважением,
Команда MedicalBrothers
      `,
    });

    console.log('Email sent:', info.messageId);
    // В development покажем URL для просмотра письма
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Отправка напоминания о приёме (за день до)
export async function sendAppointmentReminder(appointment: AppointmentWithRelations): Promise<boolean> {
  if (!appointment.patient?.email) {
    console.log('No patient email provided');
    return false;
  }

  try {
    const transporter = createTransporter();

    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });

    const appointmentTime = new Date(appointment.appointmentTime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const info = await transporter.sendMail({
      from: `"MedicalBrothers" <${process.env.SMTP_FROM || 'noreply@medicalbrothers.ru'}>`,
      to: appointment.patient.email,
      subject: '⏰ Напоминание о завтрашнем приёме',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .info-box h3 { margin-top: 0; color: #f59e0b; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Напоминание о приёме</h1>
            </div>
            <div class="content">
              <p>Здравствуйте, ${appointment.patient.name}!</p>
              <p>Напоминаем, что завтра у вас запись на приём.</p>

              <div class="info-box">
                <h3>📋 Детали записи</h3>
                <p><strong>Врач:</strong> ${appointment.doctor.name}</p>
                <p><strong>Специальность:</strong> ${appointment.doctor.specialty}</p>
                <p><strong>Дата:</strong> ${appointmentDate}</p>
                <p><strong>Время:</strong> ${appointmentTime}</p>
              </div>

              <p>Не забудьте взять с собой паспорт и полис ОМС.</p>

              <div class="footer">
                <p>С уважением,<br>Команда MedicalBrothers</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Reminder email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending reminder:', error);
    return false;
  }
}

// Уведомление врачу о новой записи
export async function sendDoctorNotification(appointment: AppointmentWithRelations): Promise<boolean> {
  if (!appointment.doctor.email) {
    console.log('No doctor email provided');
    return false;
  }

  try {
    const transporter = createTransporter();

    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });

    const appointmentTime = new Date(appointment.appointmentTime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const info = await transporter.sendMail({
      from: `"MedicalBrothers" <${process.env.SMTP_FROM || 'noreply@medicalbrothers.ru'}>`,
      to: appointment.doctor.email,
      subject: '📋 Новая запись на приём',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
            .info-box h3 { margin-top: 0; color: #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Новая запись</h1>
            </div>
            <div class="content">
              <p>Здравствуйте, ${appointment.doctor.name}!</p>
              <p>К вам записан новый пациент.</p>

              <div class="info-box">
                <h3>👤 Информация о пациенте</h3>
                <p><strong>Пациент:</strong> ${appointment.patient?.name || 'Не указано'}</p>
                <p><strong>Телефон:</strong> ${appointment.patient?.phone || 'Не указано'}</p>
                <p><strong>Дата записи:</strong> ${appointmentDate}</p>
                <p><strong>Время:</strong> ${appointmentTime}</p>
                ${appointment.symptoms ? `<p><strong>Жалобы:</strong> ${appointment.symptoms}</p>` : ''}
              </div>

              <div class="footer">
                <p>MedicalBrothers - Система управления клиникой</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Doctor notification sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending doctor notification:', error);
    return false;
  }
}

// Уведомление об отмене записи
export async function sendCancellationEmail(appointment: AppointmentWithRelations): Promise<boolean> {
  if (!appointment.patient?.email) {
    console.log('No patient email provided');
    return false;
  }

  try {
    const transporter = createTransporter();

    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const appointmentTime = new Date(appointment.appointmentTime).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const info = await transporter.sendMail({
      from: `"MedicalBrothers" <${process.env.SMTP_FROM || 'noreply@medicalbrothers.ru'}>`,
      to: appointment.patient.email,
      subject: '❌ Запись отменена',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Запись отменена</h1>
            </div>
            <div class="content">
              <p>Здравствуйте, ${appointment.patient.name}!</p>
              <p>Ваша запись на приём была отменена.</p>

              <div class="info-box">
                <p><strong>Врач:</strong> ${appointment.doctor.name}</p>
                <p><strong>Дата:</strong> ${appointmentDate}</p>
                <p><strong>Время:</strong> ${appointmentTime}</p>
              </div>

              <p>Если вы хотите записаться снова, пожалуйста, свяжитесь с нами.</p>

              <div class="footer">
                <p>С уважением,<br>Команда MedicalBrothers</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Cancellation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return false;
  }
}
