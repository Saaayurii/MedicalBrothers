/**
 * Medical AI Service
 *
 * Использует локальную модель Qwen через Ollama для:
 * - Анализа симптомов пациента
 * - Генерации рекомендаций
 * - Определения срочности обращения к врачу
 *
 * Работает полностью локально без интернета
 */

import { OllamaClient } from './ollama';

// Инициализация клиента Ollama
const ollama = new OllamaClient();

// Системный промпт для медицинского AI
const MEDICAL_SYSTEM_PROMPT = `Ты - медицинский AI-ассистент клиники MedicalBrothers. Твоя задача - помочь пациентам с предварительной оценкой симптомов и направить к нужному специалисту.

ВАЖНЫЕ ПРАВИЛА:
1. НИКОГДА не ставь диагнозы - только предварительная оценка симптомов
2. ВСЕГДА рекомендуй обратиться к врачу для точной диагностики
3. При критических симптомах (боль в груди, затруднённое дыхание, потеря сознания) - немедленно направляй в скорую помощь (103 или 112)
4. Отвечай на русском языке, дружелюбно и профессионально
5. Будь кратким, но информативным

СТРУКТУРА ОТВЕТА:
1. Понимание симптомов - кратко перечисли что понял
2. Возможные причины (2-3 варианта, без диагноза)
3. Рекомендации по самопомощи (если применимо)
4. К какому специалисту обратиться
5. Срочность: низкая / средняя / высокая / критическая

СПЕЦИАЛЬНОСТИ КЛИНИКИ:
- Терапевт - общие жалобы, простуда, усталость
- Кардиолог - сердце, давление, боль в груди
- Невролог - головные боли, головокружение, онемение
- ЛОР - горло, нос, уши
- Дерматолог - кожа, сыпь, аллергии
- Гастроэнтеролог - желудок, кишечник, пищеварение
- Эндокринолог - гормоны, щитовидка, диабет
- Офтальмолог - глаза, зрение
- Хирург - травмы, операции
- Гинеколог - женское здоровье
- Уролог - мочеполовая система
- Ортопед - суставы, кости, позвоночник
- Педиатр - детские болезни`;

export interface MedicalAnalysis {
  symptoms: string[];
  possibleCauses: string[];
  recommendations: string[];
  recommendedSpecialty: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  fullResponse: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Анализ симптомов пациента с помощью Ollama/Qwen
 */
export async function analyzeSymptoms(
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  try {
    // Проверяем доступность Ollama
    const isAvailable = await ollama.isAvailable();
    if (!isAvailable) {
      console.warn('Ollama is not available, using fallback response');
      return generateFallbackResponse(userMessage);
    }

    // Формируем сообщения для чата
    const messages: ConversationMessage[] = [
      { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
      ...conversationHistory.slice(-6), // Последние 6 сообщений для контекста
      { role: 'user', content: userMessage }
    ];

    // Получаем ответ от Ollama
    const response = await ollama.chat(messages);

    return response;
  } catch (error) {
    console.error('Error analyzing symptoms with Ollama:', error);
    return generateFallbackResponse(userMessage);
  }
}

/**
 * Быстрая классификация симптомов
 */
export async function classifySymptomUrgency(symptoms: string): Promise<{
  urgency: 'low' | 'medium' | 'high' | 'critical';
  specialty: string;
}> {
  // Критические ключевые слова
  const criticalKeywords = [
    'не могу дышать', 'задыхаюсь', 'боль в груди', 'сердечный приступ',
    'потеря сознания', 'упал в обморок', 'сильное кровотечение',
    'инсульт', 'парализовало', 'не чувствую', 'судороги',
    'анафилактический', 'отёк горла'
  ];

  const highKeywords = [
    'высокая температура', '39', '40', 'сильная боль',
    'рвота с кровью', 'кровь в моче', 'резкая боль',
    'не могу встать', 'сильное головокружение'
  ];

  const symptomsLower = symptoms.toLowerCase();

  // Проверка критических симптомов
  for (const keyword of criticalKeywords) {
    if (symptomsLower.includes(keyword)) {
      return { urgency: 'critical', specialty: 'скорая помощь' };
    }
  }

  // Проверка высокой срочности
  for (const keyword of highKeywords) {
    if (symptomsLower.includes(keyword)) {
      return { urgency: 'high', specialty: determineSpecialty(symptoms) };
    }
  }

  // Определение специальности для обычных симптомов
  const specialty = determineSpecialty(symptoms);

  return { urgency: 'medium', specialty };
}

/**
 * Определение специальности по симптомам
 */
function determineSpecialty(symptoms: string): string {
  const symptomsLower = symptoms.toLowerCase();

  const specialtyMap: Record<string, string[]> = {
    'кардиолог': ['сердце', 'давление', 'пульс', 'аритмия', 'тахикардия'],
    'невролог': ['голова', 'мигрень', 'головокружение', 'онемение', 'память'],
    'лор': ['горло', 'нос', 'ухо', 'слух', 'насморк', 'кашель', 'ангина'],
    'дерматолог': ['кожа', 'сыпь', 'прыщ', 'аллергия', 'зуд', 'покраснение'],
    'гастроэнтеролог': ['желудок', 'живот', 'тошнота', 'рвота', 'понос', 'запор', 'изжога'],
    'эндокринолог': ['вес', 'гормон', 'щитовид', 'диабет', 'жажда'],
    'офтальмолог': ['глаз', 'зрение', 'видеть', 'слепнуть'],
    'ортопед': ['спина', 'позвоночник', 'сустав', 'колено', 'плечо', 'нога', 'рука'],
    'уролог': ['моча', 'почки', 'мочеиспускание', 'простата'],
    'гинеколог': ['менструация', 'цикл', 'беременность', 'матка'],
  };

  for (const [specialty, keywords] of Object.entries(specialtyMap)) {
    for (const keyword of keywords) {
      if (symptomsLower.includes(keyword)) {
        return specialty;
      }
    }
  }

  return 'терапевт';
}

/**
 * Генерация fallback ответа когда Ollama недоступен
 */
function generateFallbackResponse(userMessage: string): string {
  const { urgency, specialty } = classifySymptomUrgencySync(userMessage);

  if (urgency === 'critical') {
    return `⚠️ ВНИМАНИЕ! Ваши симптомы требуют немедленной медицинской помощи!

🚨 Немедленно позвоните:
• 103 - Скорая помощь
• 112 - Единый номер экстренных служб

Не откладывайте обращение за помощью!`;
  }

  if (urgency === 'high') {
    return `Ваши симптомы требуют срочного внимания врача.

Рекомендую обратиться к ${specialty} в ближайшее время.

Хотите записаться на приём сегодня?`;
  }

  return `Спасибо за описание симптомов.

Для точной диагностики рекомендую обратиться к ${specialty}.

В нашей клинике есть свободные слоты. Хотите записаться на консультацию?`;
}

/**
 * Синхронная версия классификации (для fallback)
 */
function classifySymptomUrgencySync(symptoms: string): {
  urgency: 'low' | 'medium' | 'high' | 'critical';
  specialty: string;
} {
  const criticalKeywords = [
    'не могу дышать', 'задыхаюсь', 'боль в груди',
    'потеря сознания', 'сильное кровотечение', 'инсульт'
  ];

  const highKeywords = [
    'высокая температура', 'сильная боль', 'рвота с кровью'
  ];

  const symptomsLower = symptoms.toLowerCase();

  for (const keyword of criticalKeywords) {
    if (symptomsLower.includes(keyword)) {
      return { urgency: 'critical', specialty: 'скорая помощь' };
    }
  }

  for (const keyword of highKeywords) {
    if (symptomsLower.includes(keyword)) {
      return { urgency: 'high', specialty: determineSpecialty(symptoms) };
    }
  }

  return { urgency: 'medium', specialty: determineSpecialty(symptoms) };
}

/**
 * Проверка доступности Ollama
 */
export async function checkOllamaAvailability(): Promise<{
  available: boolean;
  model?: string;
  error?: string;
}> {
  try {
    const isAvailable = await ollama.isAvailable();
    if (isAvailable) {
      const models = await ollama.listModels();
      return {
        available: true,
        model: models.find(m => m.includes('qwen')) || models[0]
      };
    }
    return { available: false, error: 'Ollama не запущен' };
  } catch (error: any) {
    return { available: false, error: error.message };
  }
}
