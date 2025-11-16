'use server';

import { generateResponse, analyzeIntent, generateMedicalAdvice } from '@/lib/ollama';
import { query } from '@/lib/db';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function processVoiceCommand(
  userInput: string,
  conversationHistory: Message[]
): Promise<string> {
  try {
    // Analyze user intent
    const intentAnalysis = await analyzeIntent(userInput);
    console.log('Intent analysis:', intentAnalysis);

    // Log conversation
    await query(
      'INSERT INTO conversation_logs (user_input, intent, metadata) VALUES ($1, $2, $3)',
      [userInput, intentAnalysis.intent, JSON.stringify(intentAnalysis)]
    );

    // Route to appropriate handler based on intent
    switch (intentAnalysis.intent) {
      case 'greeting':
        return handleGreeting();

      case 'appointment':
        return await handleAppointment(userInput, intentAnalysis.entities);

      case 'consultation':
        return await handleConsultation(userInput, intentAnalysis.entities);

      case 'info':
        return await handleInfo(userInput, intentAnalysis.entities);

      case 'emergency':
        return await handleEmergency(userInput, intentAnalysis.entities);

      default:
        return await handleUnknown(userInput, conversationHistory);
    }
  } catch (error) {
    console.error('Error processing voice command:', error);
    return 'Извините, произошла ошибка. Пожалуйста, попробуйте ещё раз или обратитесь к администратору.';
  }
}

function handleGreeting(): string {
  const greetings = [
    'Здравствуйте! Я - голосовой помощник медицинской клиники MedicalBrothers. Чем могу помочь?',
    'Добрый день! Как я могу вам помочь сегодня? Могу записать на приём, ответить на вопросы или проконсультировать.',
    'Привет! Рад помочь вам. Вы можете записаться к врачу, получить консультацию или узнать информацию о клинике.',
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}

async function handleAppointment(userInput: string, entities: any): Promise<string> {
  try {
    // Get available doctors
    let doctorsQuery = 'SELECT id, name, specialty FROM doctors WHERE is_active = true';
    const params: any[] = [];

    if (entities.specialty) {
      doctorsQuery += ' AND LOWER(specialty) LIKE $1';
      params.push(`%${entities.specialty.toLowerCase()}%`);
    }

    const doctorsResult = await query(doctorsQuery, params);

    if (doctorsResult.rows.length === 0) {
      return `К сожалению, сейчас нет доступных врачей по специальности "${entities.specialty}". Могу предложить других специалистов?`;
    }

    // If specific doctor mentioned
    if (entities.doctor_name) {
      const doctor = doctorsResult.rows.find(d =>
        d.name.toLowerCase().includes(entities.doctor_name.toLowerCase())
      );

      if (doctor) {
        // Get available slots for this doctor
        const slotsResult = await query(
          `SELECT slot_date, slot_time
           FROM time_slots
           WHERE doctor_id = $1 AND is_booked = false AND slot_date >= CURRENT_DATE
           ORDER BY slot_date, slot_time
           LIMIT 5`,
          [doctor.id]
        );

        if (slotsResult.rows.length > 0) {
          const slotsText = slotsResult.rows.map((slot, i) =>
            `${i + 1}. ${formatDate(slot.slot_date)} в ${slot.slot_time}`
          ).join(', ');

          return `Отлично! У врача ${doctor.name} есть свободные слоты: ${slotsText}. Какое время вам удобно?`;
        } else {
          return `У врача ${doctor.name} пока нет свободных слотов. Создать слоты или выбрать другого врача?`;
        }
      }
    }

    // List available doctors
    const doctorsList = doctorsResult.rows.map(d =>
      `${d.name} (${d.specialty})`
    ).join(', ');

    return `У нас доступны следующие врачи: ${doctorsList}. К кому вы хотите записаться?`;
  } catch (error) {
    console.error('Error handling appointment:', error);
    return 'Извините, возникла проблема при обработке записи. Попробуйте позже.';
  }
}

async function handleConsultation(userInput: string, entities: any): Promise<string> {
  try {
    // Extract symptoms from user input
    const symptoms = entities.symptoms?.join(', ') || userInput;

    // Get AI medical advice
    const advice = await generateMedicalAdvice(symptoms);

    // Log consultation
    await query(
      'INSERT INTO consultations (symptoms, ai_response) VALUES ($1, $2)',
      [symptoms, advice]
    );

    return advice;
  } catch (error) {
    console.error('Error handling consultation:', error);
    return 'Извините, не могу обработать консультацию. Рекомендую напрямую обратиться к врачу.';
  }
}

async function handleInfo(userInput: string, entities: any): Promise<string> {
  try {
    // Search clinic info database
    const infoResult = await query(
      `SELECT answer FROM clinic_info
       WHERE is_active = true
       AND (question ILIKE $1 OR answer ILIKE $1)
       ORDER BY display_order
       LIMIT 3`,
      [`%${userInput}%`]
    );

    if (infoResult.rows.length > 0) {
      return infoResult.rows.map(r => r.answer).join('\n\n');
    }

    // Fallback: use AI to answer
    const systemPrompt = `Ты - информационный помощник медицинской клиники MedicalBrothers.
Ответь на вопрос пациента о клинике.

Информация о клинике:
- Режим работы: Пн-Пт 9:00-20:00, Сб 10:00-16:00
- Адрес: г. Москва, ул. Медицинская, д. 10
- Телефон: +7 (800) 123-45-67
- Услуги: консультации, диагностика, анализы, УЗИ, ЭКГ
- Цены: Терапевт от 2000₽, Кардиолог от 3000₽

Отвечай кратко и по делу.`;

    return await generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ]);
  } catch (error) {
    console.error('Error handling info:', error);
    return 'Извините, не могу найти информацию. Позвоните нам по телефону +7 (800) 123-45-67.';
  }
}

async function handleEmergency(userInput: string, entities: any): Promise<string> {
  try {
    // Log emergency call
    await query(
      'INSERT INTO emergency_calls (description, status, priority) VALUES ($1, $2, $3)',
      [userInput, 'pending', 'critical']
    );

    return `⚠️ ЭКСТРЕННАЯ СИТУАЦИЯ ЗАФИКСИРОВАНА!

Ваш вызов принят и передан диспетчеру.
Номер экстренной помощи: 103 или 112

Оставайтесь на связи. Помощь уже в пути.

Что произошло? Опишите ситуацию подробнее.`;
  } catch (error) {
    console.error('Error handling emergency:', error);
    return '⚠️ Срочно звоните 103 или 112! Это экстренная ситуация!';
  }
}

async function handleUnknown(userInput: string, history: Message[]): Promise<string> {
  // Use general AI conversation
  const systemPrompt = `Ты - дружелюбный голосовой помощник медицинской клиники MedicalBrothers.
Помогай пациентам с:
- Записью на приём к врачу
- Консультацией по симптомам
- Информацией о клинике
- Экстренными вызовами

Будь вежливым, понятным и заботливым.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userInput },
  ];

  return await generateResponse(messages);
}

// Helper functions
function formatDate(date: Date): string {
  const d = new Date(date);
  const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}
