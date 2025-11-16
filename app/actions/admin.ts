'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  sendAppointmentConfirmation,
  sendCancellationEmail,
  sendDoctorNotification,
} from '@/lib/email';
import { logCreate, logUpdate, logDelete, logStatusChange, AuditEntity } from '@/lib/audit';

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// ==================== ВРАЧИ ====================

export async function addDoctorAction(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const name = formData.get('name') as string;
    const specialty = formData.get('specialty') as string;
    const experienceYears = parseInt(formData.get('experienceYears') as string);
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const bio = formData.get('bio') as string;

    if (!name || !specialty) {
      return {
        success: false,
        error: 'Имя и специальность обязательны',
      };
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        specialty,
        experienceYears: experienceYears || 0,
        phone: phone || null,
        email: email || null,
        bio: bio || null,
        isActive: true,
      },
    });

    // Log the action
    await logCreate(session.adminId, AuditEntity.DOCTOR, doctor.id, {
      name: doctor.name,
      specialty: doctor.specialty,
    });

    revalidatePath('/admin');

    return {
      success: true,
      message: `Врач ${name} успешно добавлен`,
      data: doctor,
    };
  } catch (error) {
    console.error('Error adding doctor:', error);
    return {
      success: false,
      error: 'Ошибка при добавлении врача',
    };
  }
}

export async function updateDoctorStatusAction(
  doctorId: number,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: { isActive },
    });

    // Log the action
    await logUpdate(session.adminId, AuditEntity.DOCTOR, doctorId, {
      isActive,
      name: doctor.name,
    });

    revalidatePath('/admin');

    return {
      success: true,
      message: `Статус врача обновлён`,
    };
  } catch (error) {
    console.error('Error updating doctor status:', error);
    return {
      success: false,
      error: 'Ошибка при обновлении статуса',
    };
  }
}

// ==================== ВРЕМЕННЫЕ СЛОТЫ ====================

export async function generateTimeSlotsAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth();

    const doctorId = parseInt(formData.get('doctorId') as string);
    const startDate = new Date(formData.get('startDate') as string);
    const endDate = new Date(formData.get('endDate') as string);
    const startTime = formData.get('startTime') as string; // "09:00"
    const endTime = formData.get('endTime') as string; // "17:00"
    const slotDuration = parseInt(formData.get('slotDuration') as string) || 30; // минуты

    if (!doctorId || !startDate || !endDate) {
      return {
        success: false,
        error: 'Заполните все обязательные поля',
      };
    }

    // Генерируем слоты
    const slots = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Пропускаем выходные (можно настроить)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Генерируем слоты на день
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        let currentTimeMinutes = startHour * 60 + startMin;
        const endTimeMinutes = endHour * 60 + endMin;

        while (currentTimeMinutes < endTimeMinutes) {
          const hours = Math.floor(currentTimeMinutes / 60);
          const minutes = currentTimeMinutes % 60;

          const slotTime = new Date(currentDate);
          slotTime.setHours(hours, minutes, 0, 0);

          slots.push({
            doctorId,
            slotDate: new Date(currentDate),
            slotTime,
            isAvailable: true,
          });

          currentTimeMinutes += slotDuration;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Сохраняем слоты
    await prisma.timeSlot.createMany({
      data: slots,
      skipDuplicates: true,
    });

    revalidatePath('/admin');

    return {
      success: true,
      message: `Создано ${slots.length} временных слотов`,
    };
  } catch (error) {
    console.error('Error generating time slots:', error);
    return {
      success: false,
      error: 'Ошибка при создании временных слотов',
    };
  }
}

// ==================== ПАЦИЕНТЫ ====================

export async function addPatientAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAuth();

    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const address = formData.get('address') as string;

    if (!name || !phone) {
      return {
        success: false,
        error: 'Имя и телефон обязательны',
      };
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone,
        email: email || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
      },
    });

    revalidatePath('/admin');

    return {
      success: true,
      message: `Пациент ${name} успешно добавлен`,
      data: patient,
    };
  } catch (error: any) {
    console.error('Error adding patient:', error);

    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Пациент с таким телефоном уже существует',
      };
    }

    return {
      success: false,
      error: 'Ошибка при добавлении пациента',
    };
  }
}

// ==================== ЗАПИСИ ====================

export async function updateAppointmentStatusAction(
  appointmentId: number,
  status: string
): Promise<ActionResult> {
  try {
    const session = await requireAuth();

    // Get old status first
    const oldAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { status: true },
    });

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        doctor: true,
        patient: true,
      },
    });

    // Log the status change
    if (oldAppointment) {
      await logStatusChange(
        session.adminId,
        AuditEntity.APPOINTMENT,
        appointmentId,
        oldAppointment.status,
        status
      );
    }

    revalidatePath('/admin');
    revalidatePath('/appointments');

    // Отправляем email уведомление при подтверждении
    if (status === 'confirmed') {
      await sendAppointmentConfirmation(appointment);
      await sendDoctorNotification(appointment);
    }

    // Отправляем email уведомление при отмене
    if (status === 'cancelled') {
      await sendCancellationEmail(appointment);
    }

    return {
      success: true,
      message: 'Статус записи обновлён',
      data: appointment,
    };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return {
      success: false,
      error: 'Ошибка при обновлении записи',
    };
  }
}

export async function cancelAppointmentAction(appointmentId: number): Promise<ActionResult> {
  return updateAppointmentStatusAction(appointmentId, 'cancelled');
}

export async function confirmAppointmentAction(appointmentId: number): Promise<ActionResult> {
  return updateAppointmentStatusAction(appointmentId, 'confirmed');
}

// ==================== ОТЧЁТЫ ====================

export async function generateReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const reportType = (formData.get('reportType') as string) || 'daily';
    await requireAuth();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let reportData: any = {};

    switch (reportType) {
      case 'daily':
        reportData = {
          appointments: await prisma.appointment.count({
            where: {
              appointmentDate: today,
            },
          }),
          consultations: await prisma.consultation.count({
            where: {
              createdAt: {
                gte: today,
              },
            },
          }),
          emergencies: await prisma.emergencyCall.count({
            where: {
              createdAt: {
                gte: today,
              },
            },
          }),
        };
        break;

      case 'weekly':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        reportData = {
          appointments: await prisma.appointment.count({
            where: {
              appointmentDate: {
                gte: weekAgo,
              },
            },
          }),
          newPatients: await prisma.patient.count({
            where: {
              createdAt: {
                gte: weekAgo,
              },
            },
          }),
        };
        break;

      case 'doctors':
        reportData = {
          doctors: await prisma.doctor.findMany({
            select: {
              id: true,
              name: true,
              specialty: true,
              _count: {
                select: {
                  appointments: true,
                },
              },
            },
          }),
        };
        break;

      default:
        return {
          success: false,
          error: 'Неизвестный тип отчёта',
        };
    }

    return {
      success: true,
      message: 'Отчёт сгенерирован',
      data: reportData,
    };
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: 'Ошибка при генерации отчёта',
    };
  }
}
