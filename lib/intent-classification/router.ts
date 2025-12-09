/**
 * Intent Router
 *
 * Маршрутизирует запросы в соответствующие системы обработки:
 * 1. AppointmentSystem - Запись на приём
 * 2. ConsultationSystem - Консультация по симптомам (с Ollama/Qwen)
 * 3. InfoSystem - Справочная информация
 * 4. EmergencySystem - Экстренный вызов
 */

import { classifyIntent, extractSpecialty, extractDateTime } from './classifier';
import {
  IntentType,
  IntentClassificationResult,
  AppointmentIntent,
  ConsultationIntent,
  InfoIntent,
  EmergencyIntent,
} from './types';
import { analyzeSymptoms, classifySymptomUrgency } from '@/lib/medical-ai';

// Типы ответов от систем
export interface SystemResponse {
  success: boolean;
  message: string;
  data?: any;
  followUp?: {
    question: string;
    options?: string[];
  };
  action?: {
    type: string;
    payload: any;
  };
}

// Контекст разговора
export interface ConversationContext {
  sessionId: string;
  previousIntent?: IntentType;
  pendingAction?: any;
  collectedData: Record<string, any>;
}

/**
 * Главная функция маршрутизации
 */
export async function routeIntent(
  userInput: string,
  context: ConversationContext
): Promise<SystemResponse> {
  // 1. Классифицируем намерение
  const classification = await classifyIntent(userInput);

  console.log('Intent classification:', {
    intent: classification.intent,
    confidence: classification.confidence,
    entities: classification.entities,
  });

  // 2. Маршрутизируем в соответствующую систему
  switch (classification.intent) {
    case 'emergency':
      return await handleEmergency(userInput, classification, context);

    case 'appointment':
      return await handleAppointment(userInput, classification, context);

    case 'consultation':
      return await handleConsultation(userInput, classification, context);

    case 'info':
      return await handleInfo(userInput, classification, context);

    case 'greeting':
      return handleGreeting();

    default:
      return handleUnknown(userInput, classification, context);
  }
}

// ========================================
// СИСТЕМА 1: ЗАПИСЬ НА ПРИЁМ
// ========================================

async function handleAppointment(
  userInput: string,
  classification: IntentClassificationResult,
  context: ConversationContext
): Promise<SystemResponse> {
  const specialty = classification.entities.specialty || extractSpecialty(userInput);
  const dateTime = extractDateTime(userInput);

  // Определяем подтип запроса
  const subIntent = detectAppointmentSubIntent(userInput);

  switch (subIntent) {
    case 'book':
      return handleBookAppointment(specialty, dateTime, context);

    case 'cancel':
      return handleCancelAppointment(userInput, context);

    case 'reschedule':
      return handleRescheduleAppointment(userInput, context);

    case 'list':
      return handleListAppointments(context);

    case 'check':
      return handleCheckSlots(specialty, dateTime, context);

    default:
      return handleBookAppointment(specialty, dateTime, context);
  }
}

function detectAppointmentSubIntent(input: string): string {
  const normalizedInput = input.toLowerCase();

  if (normalizedInput.includes('отменить') || normalizedInput.includes('отмена')) {
    return 'cancel';
  }
  if (normalizedInput.includes('перенести') || normalizedInput.includes('перенос')) {
    return 'reschedule';
  }
  if (normalizedInput.includes('мои записи') || normalizedInput.includes('список')) {
    return 'list';
  }
  if (normalizedInput.includes('свободн') || normalizedInput.includes('когда можно')) {
    return 'check';
  }

  return 'book';
}

async function handleBookAppointment(
  specialty: string | undefined,
  dateTime: { date?: string; time?: string },
  context: ConversationContext
): Promise<SystemResponse> {
  // Если специальность не указана - запрашиваем
  if (!specialty) {
    return {
      success: true,
      message: 'К какому специалисту вы хотите записаться?',
      followUp: {
        question: 'Выберите специальность:',
        options: [
          'Терапевт',
          'Кардиолог',
          'Невролог',
          'ЛОР',
          'Дерматолог',
          'Другой специалист',
        ],
      },
      action: {
        type: 'collect_specialty',
        payload: { dateTime },
      },
    };
  }

  // Если дата не указана - показываем доступные слоты
  if (!dateTime.date) {
    return {
      success: true,
      message: `Хорошо, записываем вас к ${specialty}. Когда вам удобно?`,
      followUp: {
        question: 'Выберите дату:',
        options: ['Сегодня', 'Завтра', 'На этой неделе', 'На следующей неделе'],
      },
      action: {
        type: 'show_available_slots',
        payload: { specialty },
      },
    };
  }

  // Всё есть - создаём запись (в реальном приложении - через БД)
  return {
    success: true,
    message: `Отлично! Записываю вас к ${specialty} на ${dateTime.date}${dateTime.time ? ` в ${dateTime.time}` : ''}. Подтвердите, пожалуйста.`,
    action: {
      type: 'confirm_appointment',
      payload: { specialty, ...dateTime },
    },
  };
}

async function handleCancelAppointment(
  userInput: string,
  context: ConversationContext
): Promise<SystemResponse> {
  return {
    success: true,
    message: 'Для отмены записи мне нужно найти её. Подскажите, к какому врачу и на какую дату была запись?',
    action: {
      type: 'find_appointment_to_cancel',
      payload: {},
    },
  };
}

async function handleRescheduleAppointment(
  userInput: string,
  context: ConversationContext
): Promise<SystemResponse> {
  return {
    success: true,
    message: 'Хорошо, давайте перенесём вашу запись. На какую дату вы хотите перенести?',
    action: {
      type: 'reschedule_appointment',
      payload: {},
    },
  };
}

async function handleListAppointments(
  context: ConversationContext
): Promise<SystemResponse> {
  return {
    success: true,
    message: 'Сейчас покажу ваши записи.',
    action: {
      type: 'list_appointments',
      payload: {},
    },
  };
}

async function handleCheckSlots(
  specialty: string | undefined,
  dateTime: { date?: string; time?: string },
  context: ConversationContext
): Promise<SystemResponse> {
  if (!specialty) {
    return {
      success: true,
      message: 'К какому специалисту вы хотите узнать свободные слоты?',
      followUp: {
        question: 'Выберите специальность:',
        options: ['Терапевт', 'Кардиолог', 'Невролог', 'ЛОР', 'Другой'],
      },
    };
  }

  return {
    success: true,
    message: `Проверяю свободные слоты у ${specialty}...`,
    action: {
      type: 'check_available_slots',
      payload: { specialty, date: dateTime.date },
    },
  };
}

// ========================================
// СИСТЕМА 2: КОНСУЛЬТАЦИЯ ПО СИМПТОМАМ
// Использует Ollama + Qwen для анализа
// ========================================

async function handleConsultation(
  userInput: string,
  classification: IntentClassificationResult,
  context: ConversationContext
): Promise<SystemResponse> {
  const symptoms = classification.entities.symptoms || [userInput];
  const severity = classification.entities.severity || 'medium';

  // Проверяем на критическую тяжесть
  if (severity === 'critical') {
    return {
      success: true,
      message: `⚠️ Ваши симптомы требуют срочного внимания!

Рекомендации:
1. Если состояние критическое - вызовите скорую помощь: 103 или 112
2. Не откладывайте обращение к врачу

Хотите, чтобы я записал вас на экстренный приём?`,
      action: {
        type: 'urgent_consultation',
        payload: { symptoms, severity },
      },
    };
  }

  // Используем Ollama/Qwen для анализа симптомов
  try {
    // Формируем историю разговора для контекста
    const conversationHistory = context.collectedData.conversationHistory || [];

    // Получаем AI-анализ симптомов через локальную модель Qwen
    const aiResponse = await analyzeSymptoms(userInput, conversationHistory);

    // Сохраняем сообщения в контекст
    context.collectedData.conversationHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: userInput },
      { role: 'assistant' as const, content: aiResponse }
    ].slice(-10); // Храним последние 10 сообщений

    // Определяем срочность и специальность
    const urgencyAnalysis = await classifySymptomUrgency(userInput);

    return {
      success: true,
      message: aiResponse,
      data: {
        symptoms,
        severity: urgencyAnalysis.urgency,
        recommendedSpecialty: urgencyAnalysis.specialty,
        aiAnalyzed: true,
      },
      followUp: urgencyAnalysis.urgency !== 'low' ? {
        question: 'Записать вас к врачу?',
        options: ['Да, записать', 'Нет, спасибо', 'Задать ещё вопрос'],
      } : undefined,
    };
  } catch (error) {
    console.error('Error with AI consultation:', error);

    // Fallback на keyword-based ответ
    const recommendedSpecialty = extractSpecialty(userInput) || determineSpecialtyBySymptoms(symptoms);

    return {
      success: true,
      message: `Я понял ваши симптомы. Вот мои рекомендации:

${generateConsultationAdvice(symptoms, severity)}

${recommendedSpecialty
    ? `Рекомендую обратиться к ${recommendedSpecialty}. Хотите записаться на приём?`
    : 'Рекомендую проконсультироваться с терапевтом для точной диагностики. Записать вас?'
}`,
      data: {
        symptoms,
        severity,
        recommendedSpecialty,
      },
      followUp: {
        question: 'Записать вас к врачу?',
        options: ['Да, записать', 'Нет, спасибо', 'Узнать больше'],
      },
    };
  }
}

function determineSpecialtyBySymptoms(symptoms: string[]): string | undefined {
  const symptomsText = symptoms.join(' ').toLowerCase();

  if (symptomsText.includes('сердце') || symptomsText.includes('давление')) {
    return 'кардиолог';
  }
  if (symptomsText.includes('голова') || symptomsText.includes('головная боль')) {
    return 'невролог';
  }
  if (symptomsText.includes('горло') || symptomsText.includes('ухо') || symptomsText.includes('нос')) {
    return 'лор';
  }
  if (symptomsText.includes('кожа') || symptomsText.includes('сыпь')) {
    return 'дерматолог';
  }
  if (symptomsText.includes('желудок') || symptomsText.includes('живот')) {
    return 'гастроэнтеролог';
  }

  return 'терапевт';
}

function generateConsultationAdvice(symptoms: string[], severity: string): string {
  let advice = '';

  switch (severity) {
    case 'high':
      advice = `🔴 Ваши симптомы требуют внимания врача в ближайшее время.
До приёма врача:
- Избегайте физических нагрузок
- Следите за температурой
- При ухудшении вызывайте скорую`;
      break;

    case 'medium':
      advice = `🟡 Рекомендую обратиться к врачу в течение 1-2 дней.
Общие рекомендации:
- Отдых и покой
- Обильное питьё
- Следите за изменением симптомов`;
      break;

    default:
      advice = `🟢 Симптомы не вызывают серьёзного беспокойства, но консультация врача не помешает.
Рекомендации:
- Наблюдайте за состоянием
- При ухудшении обратитесь к врачу`;
  }

  return advice;
}

// ========================================
// СИСТЕМА 3: СПРАВОЧНАЯ ИНФОРМАЦИЯ
// ========================================

async function handleInfo(
  userInput: string,
  classification: IntentClassificationResult,
  context: ConversationContext
): Promise<SystemResponse> {
  const infoType = detectInfoType(userInput);

  switch (infoType) {
    case 'working_hours':
      return {
        success: true,
        message: `🕐 Часы работы клиники MedicalBrothers:

Понедельник - Пятница: 9:00 - 20:00
Суббота: 10:00 - 16:00
Воскресенье: выходной

Запись по телефону: +7 (949) 99-99-99
Онлайн-запись доступна 24/7`,
      };

    case 'address':
      return {
        success: true,
        message: `📍 Адрес клиники MedicalBrothers:

г. Москва, ул. Медицинская, д. 10
Метро: Медицинская (5 минут пешком)

Как добраться:
- На метро: выход №2, направо до конца улицы
- На машине: парковка у здания бесплатная`,
      };

    case 'prices':
      return {
        success: true,
        message: `💰 Примерные цены на услуги:

Консультации:
- Терапевт: от 2000₽
- Кардиолог: от 3000₽
- Невролог: от 2500₽
- ЛОР: от 2000₽

Диагностика:
- УЗИ: от 1500₽
- ЭКГ: от 1000₽
- Анализы: от 500₽

Для точной стоимости позвоните: +7 (949) 99-99-99`,
      };

    case 'services':
      return {
        success: true,
        message: `🏥 Услуги клиники MedicalBrothers:

Консультации специалистов:
- Терапевт, кардиолог, невролог
- ЛОР, дерматолог, гинеколог
- Педиатр, эндокринолог и др.

Диагностика:
- УЗИ всех органов
- ЭКГ, Холтер мониторинг
- Лабораторные анализы

Процедуры:
- Вакцинация
- Инъекции, капельницы
- Физиотерапия`,
      };

    case 'doctors':
      return {
        success: true,
        message: `👨‍⚕️ Наши специалисты - опытные врачи с многолетней практикой.

Чтобы узнать больше о конкретном враче или посмотреть список специалистов, скажите:
- "Покажи терапевтов"
- "Кто принимает сегодня"
- "Информация о враче [имя]"`,
        action: {
          type: 'list_doctors',
          payload: {},
        },
      };

    default:
      return {
        success: true,
        message: `ℹ️ Клиника MedicalBrothers - современный медицинский центр.

Что вы хотите узнать?`,
        followUp: {
          question: 'Выберите тему:',
          options: ['Часы работы', 'Адрес', 'Цены', 'Услуги', 'Врачи'],
        },
      };
  }
}

function detectInfoType(input: string): string {
  const normalizedInput = input.toLowerCase();

  for (const [type, keywords] of Object.entries({
    working_hours: ['время работы', 'часы работы', 'расписание', 'когда работает', 'во сколько'],
    address: ['адрес', 'где находится', 'как доехать', 'проезд'],
    prices: ['цена', 'стоимость', 'сколько стоит', 'прайс'],
    services: ['услуги', 'что делаете', 'процедуры'],
    doctors: ['врачи', 'специалисты', 'кто принимает'],
  })) {
    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword)) {
        return type;
      }
    }
  }

  return 'general';
}

// ========================================
// СИСТЕМА 4: ЭКСТРЕННЫЙ ВЫЗОВ
// ========================================

async function handleEmergency(
  userInput: string,
  classification: IntentClassificationResult,
  context: ConversationContext
): Promise<SystemResponse> {
  const emergencyType = classification.entities.emergencyType || 'other';
  const symptoms = classification.entities.symptoms || [];

  return {
    success: true,
    message: `⚠️ ЭКСТРЕННАЯ СИТУАЦИЯ ЗАФИКСИРОВАНА!

🚨 Ваш вызов принят и передан диспетчеру.

ВАЖНО - Номера экстренной помощи:
📞 103 - Скорая помощь
📞 112 - Единый номер экстренных служб

${getEmergencyInstructions(emergencyType)}

Оставайтесь на связи. Вам нужна дополнительная помощь?`,
    data: {
      emergencyType,
      symptoms,
      timestamp: new Date().toISOString(),
    },
    action: {
      type: 'log_emergency',
      payload: {
        description: userInput,
        emergencyType,
        symptoms,
        priority: 'critical',
      },
    },
  };
}

function getEmergencyInstructions(type: string): string {
  const instructions: Record<string, string> = {
    cardiac: `При боли в груди:
- Сядьте или лягте в удобное положение
- Расстегните тесную одежду
- Если есть нитроглицерин - примите под язык
- НЕ двигайтесь, ждите помощь`,

    respiratory: `При затруднении дыхания:
- Сядьте прямо, не ложитесь
- Откройте окно для свежего воздуха
- Ослабьте одежду на груди
- Дышите медленно и глубоко`,

    stroke: `При признаках инсульта:
- Уложите человека
- Поверните голову набок
- НЕ давайте есть и пить
- Запомните время начала симптомов`,

    trauma: `При травме:
- Не двигайте пострадавшего
- При кровотечении - прижмите рану
- Дождитесь скорую помощь`,

    bleeding: `При сильном кровотечении:
- Прижмите рану чистой тканью
- Держите давление минимум 10 минут
- НЕ убирайте ткань, добавляйте сверху`,

    unconscious: `Если человек без сознания:
- Проверьте дыхание
- Положите на бок (recovery position)
- Не оставляйте одного
- Начните СЛР если нет дыхания`,
  };

  return instructions[type] || `Сохраняйте спокойствие.
Скорая помощь уже в пути.
Оставайтесь на связи.`;
}

// ========================================
// ВСПОМОГАТЕЛЬНЫЕ ОБРАБОТЧИКИ
// ========================================

function handleGreeting(): SystemResponse {
  const greetings = [
    'Здравствуйте! Я - голосовой помощник медицинской клиники MedicalBrothers.',
    'Добрый день! Рад помочь вам.',
    'Привет! Чем могу помочь?',
  ];

  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

  return {
    success: true,
    message: `${randomGreeting}

Я могу помочь вам с:
• Записью на приём к врачу
• Консультацией по симптомам
• Информацией о клинике
• Экстренным вызовом

Что вас интересует?`,
  };
}

function handleUnknown(
  userInput: string,
  classification: IntentClassificationResult,
  context: ConversationContext
): SystemResponse {
  return {
    success: true,
    message: `Извините, я не совсем понял ваш запрос.

Вы можете:
• Записаться на приём - скажите "Записать к терапевту"
• Получить консультацию - опишите симптомы
• Узнать информацию - спросите о часах работы, ценах
• Вызвать помощь - скажите "Срочно нужна помощь"

Как я могу вам помочь?`,
    followUp: {
      question: 'Выберите действие:',
      options: ['Записаться к врачу', 'Консультация', 'Информация о клинике', 'Связаться с оператором'],
    },
  };
}

export {
  handleAppointment,
  handleConsultation,
  handleInfo,
  handleEmergency,
  handleGreeting,
  handleUnknown,
};
