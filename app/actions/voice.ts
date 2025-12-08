'use server';

import { query } from '@/lib/db';
import { routeIntent, classifyIntent, SystemResponse, ConversationContext } from '@/lib/intent-classification';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Хранилище сессий (в production - Redis/DB)
const sessions = new Map<string, ConversationContext>();

/**
 * Получить или создать контекст сессии
 */
function getSessionContext(sessionId: string): ConversationContext {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      collectedData: {},
    });
  }
  return sessions.get(sessionId)!;
}

/**
 * Основная функция обработки голосовой команды
 * Использует новую систему классификации намерений
 */
export async function processVoiceCommand(
  userInput: string,
  conversationHistory: Message[],
  sessionId?: string
): Promise<string> {
  try {
    // Получаем контекст сессии
    const context = getSessionContext(sessionId || generateSessionId());

    // Маршрутизируем запрос через систему классификации
    const response = await routeIntent(userInput, context);

    // Логируем в базу данных
    await logConversation(userInput, response, context.sessionId);

    // Выполняем действия если требуется
    if (response.action) {
      await executeAction(response.action, context);
    }

    // Обновляем контекст
    const classification = await classifyIntent(userInput, false);
    context.previousIntent = classification.intent;

    return response.message;
  } catch (error) {
    console.error('Error processing voice command:', error);
    return 'Извините, произошла ошибка. Пожалуйста, попробуйте ещё раз или обратитесь к администратору.';
  }
}

/**
 * Выполнение действий на основе ответа системы
 */
async function executeAction(
  action: { type: string; payload: any },
  context: ConversationContext
): Promise<void> {
  try {
    switch (action.type) {
      case 'show_available_slots':
        // Загружаем доступные слоты из БД
        const specialty = action.payload.specialty;
        const slotsResult = await query(
          `SELECT ts.id, ts.slot_date, ts.slot_time, d.name as doctor_name
           FROM time_slots ts
           JOIN doctors d ON ts.doctor_id = d.id
           WHERE d.is_active = true
           AND ts.is_booked = false
           AND ts.slot_date >= CURRENT_DATE
           AND LOWER(d.specialty) LIKE $1
           ORDER BY ts.slot_date, ts.slot_time
           LIMIT 10`,
          [`%${specialty.toLowerCase()}%`]
        );
        context.collectedData.availableSlots = slotsResult.rows;
        break;

      case 'confirm_appointment':
        // Сохраняем данные для подтверждения
        context.collectedData.pendingAppointment = action.payload;
        context.pendingAction = 'confirm_appointment';
        break;

      case 'log_emergency':
        // Логируем экстренный вызов
        await query(
          'INSERT INTO emergency_calls (description, status, priority) VALUES ($1, $2, $3)',
          [action.payload.description, 'pending', action.payload.priority]
        );
        break;

      case 'list_appointments':
        // Получаем записи пациента (в production - по ID пациента)
        const appointmentsResult = await query(
          `SELECT a.id, a.appointment_date, a.appointment_time, a.status,
                  d.name as doctor_name, d.specialty
           FROM appointments a
           JOIN doctors d ON a.doctor_id = d.id
           WHERE a.status IN ('scheduled', 'confirmed')
           AND a.appointment_date >= CURRENT_DATE
           ORDER BY a.appointment_date, a.appointment_time
           LIMIT 10`
        );
        context.collectedData.appointments = appointmentsResult.rows;
        break;

      case 'check_available_slots':
        // Проверяем доступные слоты
        const checkSpecialty = action.payload.specialty;
        const checkDate = action.payload.date;
        let slotsQuery = `
          SELECT ts.id, ts.slot_date, ts.slot_time, d.name as doctor_name, d.specialty
          FROM time_slots ts
          JOIN doctors d ON ts.doctor_id = d.id
          WHERE d.is_active = true
          AND ts.is_booked = false
          AND ts.slot_date >= CURRENT_DATE`;
        const params: any[] = [];

        if (checkSpecialty) {
          params.push(`%${checkSpecialty.toLowerCase()}%`);
          slotsQuery += ` AND LOWER(d.specialty) LIKE $${params.length}`;
        }
        if (checkDate) {
          params.push(checkDate);
          slotsQuery += ` AND ts.slot_date = $${params.length}`;
        }

        slotsQuery += ' ORDER BY ts.slot_date, ts.slot_time LIMIT 20';

        const availableSlotsResult = await query(slotsQuery, params);
        context.collectedData.availableSlots = availableSlotsResult.rows;
        break;

      case 'list_doctors':
        // Получаем список врачей
        const doctorsResult = await query(
          `SELECT id, name, specialty, experience_years, bio
           FROM doctors
           WHERE is_active = true
           ORDER BY specialty, name`
        );
        context.collectedData.doctors = doctorsResult.rows;
        break;

      case 'urgent_consultation':
        // Логируем срочную консультацию
        await query(
          `INSERT INTO consultations (symptoms, severity_level, ai_response)
           VALUES ($1, $2, $3)`,
          [
            action.payload.symptoms.join(', '),
            action.payload.severity,
            'Требуется срочная консультация врача',
          ]
        );
        break;
    }
  } catch (error) {
    console.error('Error executing action:', error);
  }
}

/**
 * Логирование разговора в БД
 */
async function logConversation(
  userInput: string,
  response: SystemResponse,
  sessionId: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO conversation_logs (session_id, user_input, ai_response, intent, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        sessionId,
        userInput,
        response.message,
        response.data?.intent || null,
        JSON.stringify({
          success: response.success,
          action: response.action?.type,
          timestamp: new Date().toISOString(),
        }),
      ]
    );
  } catch (error) {
    console.error('Error logging conversation:', error);
  }
}

/**
 * Генерация ID сессии
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Создание записи на приём
 */
export async function createAppointment(
  doctorId: number,
  timeSlotId: number,
  symptoms?: string,
  patientId?: number
): Promise<{ success: boolean; message: string; appointmentId?: number }> {
  try {
    // Проверяем доступность слота
    const slotCheck = await query(
      'SELECT id, slot_date, slot_time, is_booked FROM time_slots WHERE id = $1',
      [timeSlotId]
    );

    if (slotCheck.rows.length === 0) {
      return { success: false, message: 'Выбранный слот не найден' };
    }

    if (slotCheck.rows[0].is_booked) {
      return { success: false, message: 'Этот слот уже занят. Выберите другое время.' };
    }

    const slot = slotCheck.rows[0];

    // Создаём запись
    const appointmentResult = await query(
      `INSERT INTO appointments (patient_id, doctor_id, time_slot_id, appointment_date, appointment_time, symptoms, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING id`,
      [patientId || null, doctorId, timeSlotId, slot.slot_date, slot.slot_time, symptoms || null]
    );

    // Помечаем слот как занятый
    await query('UPDATE time_slots SET is_booked = true WHERE id = $1', [timeSlotId]);

    return {
      success: true,
      message: 'Запись успешно создана!',
      appointmentId: appointmentResult.rows[0].id,
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { success: false, message: 'Ошибка при создании записи. Попробуйте позже.' };
  }
}

/**
 * Отмена записи
 */
export async function cancelAppointment(
  appointmentId: number
): Promise<{ success: boolean; message: string }> {
  try {
    // Получаем информацию о записи
    const appointment = await query(
      'SELECT id, time_slot_id, status FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointment.rows.length === 0) {
      return { success: false, message: 'Запись не найдена' };
    }

    if (appointment.rows[0].status === 'cancelled') {
      return { success: false, message: 'Эта запись уже отменена' };
    }

    // Отменяем запись
    await query(
      "UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [appointmentId]
    );

    // Освобождаем слот
    await query('UPDATE time_slots SET is_booked = false WHERE id = $1', [
      appointment.rows[0].time_slot_id,
    ]);

    return { success: true, message: 'Запись успешно отменена' };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return { success: false, message: 'Ошибка при отмене записи' };
  }
}

/**
 * Получение доступных слотов
 */
export async function getAvailableSlots(
  specialty?: string,
  date?: string,
  doctorId?: number
): Promise<any[]> {
  try {
    let queryStr = `
      SELECT
        ts.id,
        ts.slot_date,
        ts.slot_time,
        ts.duration_minutes,
        d.id as doctor_id,
        d.name as doctor_name,
        d.specialty
      FROM time_slots ts
      JOIN doctors d ON ts.doctor_id = d.id
      WHERE d.is_active = true
      AND ts.is_booked = false
      AND ts.slot_date >= CURRENT_DATE
    `;
    const params: any[] = [];

    if (specialty) {
      params.push(`%${specialty.toLowerCase()}%`);
      queryStr += ` AND LOWER(d.specialty) LIKE $${params.length}`;
    }

    if (date) {
      params.push(date);
      queryStr += ` AND ts.slot_date = $${params.length}`;
    }

    if (doctorId) {
      params.push(doctorId);
      queryStr += ` AND d.id = $${params.length}`;
    }

    queryStr += ' ORDER BY ts.slot_date, ts.slot_time LIMIT 50';

    const result = await query(queryStr, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting available slots:', error);
    return [];
  }
}

/**
 * Получение списка врачей
 */
export async function getDoctors(specialty?: string): Promise<any[]> {
  try {
    let queryStr = `
      SELECT id, name, specialty, experience_years, bio, photo_url
      FROM doctors
      WHERE is_active = true
    `;
    const params: any[] = [];

    if (specialty) {
      params.push(`%${specialty.toLowerCase()}%`);
      queryStr += ` AND LOWER(specialty) LIKE $${params.length}`;
    }

    queryStr += ' ORDER BY specialty, name';

    const result = await query(queryStr, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting doctors:', error);
    return [];
  }
}

// Helper functions
function formatDate(date: Date): string {
  const d = new Date(date);
  const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];

  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime(time: string | Date): string {
  if (typeof time === 'string') {
    return time.substring(0, 5); // "HH:MM"
  }
  const d = new Date(time);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
