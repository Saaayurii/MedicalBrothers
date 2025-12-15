/**
 * Intent Classification and Routing for Voice Assistant
 * Uses Ollama/Qwen for natural language understanding
 */

import { ollama } from './ollama';

export interface ConversationContext {
  sessionId: string;
  collectedData: Record<string, any>;
  previousIntent?: string;
  pendingAction?: string;
}

export interface SystemResponse {
  success: boolean;
  message: string;
  data?: any;
  action?: {
    type: string;
    payload: any;
  };
}

/**
 * Classify user intent using Ollama/Qwen
 */
export async function classifyIntent(
  userInput: string,
  useOllama: boolean = true
): Promise<{ intent: string; confidence: number; entities: any }> {
  // Simple pattern matching for common intents
  const lowerInput = userInput.toLowerCase();

  // Emergency detection
  if (
    lowerInput.includes('срочно') ||
    lowerInput.includes('экстренно') ||
    lowerInput.includes('скорая') ||
    lowerInput.includes('очень плохо') ||
    lowerInput.includes('умираю')
  ) {
    return { intent: 'emergency', confidence: 0.95, entities: {} };
  }

  // Appointment booking
  if (
    lowerInput.includes('записаться') ||
    lowerInput.includes('запись') ||
    lowerInput.includes('приём') ||
    lowerInput.includes('прием')
  ) {
    return { intent: 'book_appointment', confidence: 0.9, entities: {} };
  }

  // General consultation
  if (
    lowerInput.includes('болит') ||
    lowerInput.includes('симптом') ||
    lowerInput.includes('температура') ||
    lowerInput.includes('кашель')
  ) {
    return { intent: 'consultation', confidence: 0.85, entities: {} };
  }

  // Clinic info
  if (
    lowerInput.includes('расписание') ||
    lowerInput.includes('адрес') ||
    lowerInput.includes('телефон') ||
    lowerInput.includes('часы работы')
  ) {
    return { intent: 'clinic_info', confidence: 0.9, entities: {} };
  }

  // Default: general query
  return { intent: 'general', confidence: 0.7, entities: {} };
}

/**
 * Route user request to appropriate handler
 * Uses Ollama/Qwen for intelligent responses
 */
export async function routeIntent(
  userInput: string,
  context: ConversationContext
): Promise<SystemResponse> {
  try {
    // Classify intent
    const classification = await classifyIntent(userInput);

    // Build context-aware system prompt
    const systemPrompt = buildSystemPrompt(classification.intent, context);

    // Get response from Ollama/Qwen
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userInput },
    ];

    const aiResponse = await ollama.chat(messages);

    // Determine if action is needed
    const action = determineAction(classification.intent, userInput, aiResponse);

    return {
      success: true,
      message: aiResponse,
      data: { intent: classification.intent },
      action,
    };
  } catch (error) {
    console.error('Error routing intent:', error);
    return {
      success: false,
      message: 'Извините, произошла ошибка. Пожалуйста, повторите ваш вопрос.',
    };
  }
}

/**
 * Build system prompt based on intent
 */
function buildSystemPrompt(intent: string, context: ConversationContext): string {
  const basePrompt = `Вы - медицинский голосовой ассистент клиники MedicalBrothers.

🚨 КРИТИЧЕСКИ ВАЖНО - АБСОЛЮТНОЕ ТРЕБОВАНИЕ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ОТВЕЧАЙТЕ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ (КИРИЛЛИЦА)!
2. ЗАПРЕЩЕНО использовать китайские символы (汉字)!
3. ЗАПРЕЩЕНО использовать английский или другие языки!
4. ЕСЛИ вы не знаете русского слова - НАПИШИТЕ "не знаю"!
5. ВЕСЬ текст ДОЛЖЕН быть на русском языке!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Правила ответа:
- Отвечайте КРАТКО: максимум 2-3 КОРОТКИХ предложения
- Используйте ПРОСТЫЕ русские слова
- Будьте вежливы и профессиональны
- НЕ ставьте диагнозы - только общие рекомендации
- Ваш ответ будет озвучен голосом - пишите так, как говорят люди

Доступные специалисты:
- Терапевт
- Кардиолог
- Невролог
- Педиатр
- Эндокринолог
- Дерматолог

Часы работы: Пн-Пт 8:00-20:00, Сб-Вс 9:00-18:00

ПРИМЕР ХОРОШЕГО ОТВЕТА: "Боль в животе может быть по разным причинам. Рекомендую обратиться к терапевту для осмотра. Могу записать вас на приём?"
ПРИМЕР ПЛОХОГО ОТВЕТА: "Боль... 伴有..." ← НЕТ! Китайские символы ЗАПРЕЩЕНЫ!`;

  switch (intent) {
    case 'emergency':
      return `${basePrompt}

СИТУАЦИЯ: Пациент описывает ЭКСТРЕННУЮ ситуацию!
ВАША ЗАДАЧА:
1. Сообщите, что это серьёзно
2. Рекомендуйте НЕМЕДЛЕННО вызвать скорую (103) или обратиться в приёмный покой
3. Будьте спокойны и чётки`;

    case 'book_appointment':
      return `${basePrompt}

СИТУАЦИЯ: Пациент хочет записаться на приём
ВАША ЗАДАЧА:
1. Спросите, к какому специалисту (если не указано)
2. Спросите удобную дату/время (если не указано)
3. Скажите, что запись будет создана`;

    case 'consultation':
      return `${basePrompt}

СИТУАЦИЯ: Пациент описывает симптомы
ВАША ЗАДАЧА:
1. Выслушайте симптомы
2. Дайте ОБЩИЕ рекомендации (без диагноза!)
3. Рекомендуйте обратиться к врачу для точного диагноза
4. Если серьёзно - рекомендуйте срочную консультацию`;

    case 'clinic_info':
      return `${basePrompt}

СИТУАЦИЯ: Пациент спрашивает о клинике
ВАША ЗАДАЧА:
Предоставьте информацию:
- Адрес: г. Москва, ул. Примерная, д. 123
- Телефон: +7 (495) 123-45-67
- Часы работы: Пн-Пт 8:00-20:00, Сб-Вс 9:00-18:00`;

    default:
      return `${basePrompt}

СИТУАЦИЯ: Общий вопрос
ВАША ЗАДАЧА:
Ответьте на вопрос пациента профессионально и кратко.`;
  }
}

/**
 * Determine what action needs to be taken
 */
function determineAction(
  intent: string,
  userInput: string,
  aiResponse: string
): { type: string; payload: any } | undefined {
  switch (intent) {
    case 'emergency':
      return {
        type: 'log_emergency',
        payload: {
          description: userInput,
          priority: 'critical',
        },
      };

    case 'book_appointment':
      // Extract specialty if mentioned
      const specialties = ['терапевт', 'кардиолог', 'невролог', 'педиатр', 'эндокринолог', 'дерматолог'];
      const lowerInput = userInput.toLowerCase();
      const foundSpecialty = specialties.find((s) => lowerInput.includes(s));

      if (foundSpecialty) {
        return {
          type: 'check_available_slots',
          payload: { specialty: foundSpecialty },
        };
      }
      break;

    case 'consultation':
      return {
        type: 'urgent_consultation',
        payload: {
          symptoms: [userInput],
          severity: 'medium',
        },
      };
  }

  return undefined;
}
