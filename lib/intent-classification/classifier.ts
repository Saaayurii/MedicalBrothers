/**
 * Intent Classifier
 *
 * Основной модуль классификации намерений пациента
 * Использует комбинацию keyword matching и AI анализа
 */

import { ollama } from '@/lib/ollama';
import {
  IntentType,
  IntentClassificationResult,
  ExtractedEntities,
  ConfidenceLevel,
  SeverityLevel,
  EmergencyType,
  MEDICAL_SPECIALTIES,
  SEVERITY_KEYWORDS,
  INFO_KEYWORDS,
  EMERGENCY_KEYWORDS,
  DEFAULT_CONFIG,
} from './types';

/**
 * Основная функция классификации намерения
 */
export async function classifyIntent(
  userInput: string,
  useAI: boolean = true
): Promise<IntentClassificationResult> {
  const normalizedInput = userInput.toLowerCase().trim();

  // 1. Сначала проверяем экстренные ситуации (высший приоритет)
  const emergencyCheck = checkEmergency(normalizedInput);
  if (emergencyCheck.isEmergency) {
    return {
      intent: 'emergency',
      confidence: emergencyCheck.confidence,
      confidenceLevel: getConfidenceLevel(emergencyCheck.confidence),
      subIntent: emergencyCheck.emergencyType,
      entities: {
        symptoms: emergencyCheck.symptoms,
        severity: 'critical',
        emergencyType: emergencyCheck.emergencyType as EmergencyType,
      },
    };
  }

  // 2. Keyword-based классификация
  const keywordResult = classifyByKeywords(normalizedInput);

  // 3. Если уверенность высокая - возвращаем результат
  if (keywordResult.confidence >= DEFAULT_CONFIG.confidenceThreshold.high) {
    return keywordResult;
  }

  // 4. Если AI включён и уверенность низкая - используем AI
  if (useAI && keywordResult.confidence < DEFAULT_CONFIG.confidenceThreshold.medium) {
    try {
      const aiResult = await classifyWithAI(userInput);
      // Комбинируем результаты, отдавая приоритет AI
      return mergeResults(keywordResult, aiResult);
    } catch (error) {
      console.error('AI classification failed, using keyword result:', error);
    }
  }

  return keywordResult;
}

/**
 * Проверка на экстренную ситуацию
 */
function checkEmergency(input: string): {
  isEmergency: boolean;
  confidence: number;
  emergencyType?: string;
  symptoms: string[];
} {
  const symptoms: string[] = [];
  let maxConfidence = 0;
  let emergencyType: string | undefined;

  for (const [type, keywords] of Object.entries(EMERGENCY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        symptoms.push(keyword);
        const confidence = 0.9 + (keyword.length > 10 ? 0.1 : 0);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          emergencyType = type;
        }
      }
    }
  }

  return {
    isEmergency: maxConfidence >= 0.8,
    confidence: maxConfidence,
    emergencyType,
    symptoms,
  };
}

/**
 * Классификация по ключевым словам
 */
function classifyByKeywords(input: string): IntentClassificationResult {
  const scores: Record<IntentType, number> = {
    appointment: 0,
    consultation: 0,
    info: 0,
    emergency: 0,
    greeting: 0,
    unknown: 0.1, // Базовый score для unknown
  };

  const entities: ExtractedEntities = {};

  // Приветствие
  const greetingKeywords = ['привет', 'здравствуй', 'добрый день', 'добрый вечер', 'доброе утро', 'здорово'];
  for (const kw of greetingKeywords) {
    if (input.includes(kw)) {
      scores.greeting += 0.4;
    }
  }

  // Запись на приём
  const appointmentKeywords = [
    { word: 'записаться', score: 0.4 },
    { word: 'запись', score: 0.35 },
    { word: 'записать', score: 0.4 },
    { word: 'приём', score: 0.3 },
    { word: 'прием', score: 0.3 },
    { word: 'принять', score: 0.2 },
    { word: 'врач', score: 0.15 },
    { word: 'доктор', score: 0.15 },
    { word: 'когда свободен', score: 0.35 },
    { word: 'свободные слоты', score: 0.4 },
    { word: 'отменить запись', score: 0.45 },
    { word: 'перенести', score: 0.4 },
    { word: 'мои записи', score: 0.45 },
  ];

  for (const { word, score } of appointmentKeywords) {
    if (input.includes(word)) {
      scores.appointment += score;
    }
  }

  // Извлекаем специальность
  for (const [key, specialty] of Object.entries(MEDICAL_SPECIALTIES)) {
    for (const keyword of specialty.keywords) {
      if (input.includes(keyword)) {
        entities.specialty = specialty.ru;
        scores.appointment += 0.2; // Упоминание специальности повышает вероятность записи
        break;
      }
    }
  }

  // Консультация
  const consultationKeywords = [
    { word: 'болит', score: 0.3 },
    { word: 'симптом', score: 0.4 },
    { word: 'беспокоит', score: 0.3 },
    { word: 'что делать', score: 0.25 },
    { word: 'помогите', score: 0.2 },
    { word: 'температура', score: 0.25 },
    { word: 'плохо себя чувствую', score: 0.35 },
    { word: 'заболел', score: 0.3 },
    { word: 'как лечить', score: 0.35 },
    { word: 'посоветуйте', score: 0.25 },
  ];

  for (const { word, score } of consultationKeywords) {
    if (input.includes(word)) {
      scores.consultation += score;
    }
  }

  // Определяем тяжесть симптомов
  entities.severity = detectSeverity(input);

  // Справочная информация
  for (const [infoType, keywords] of Object.entries(INFO_KEYWORDS)) {
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        scores.info += 0.35;
        break;
      }
    }
  }

  // Находим намерение с максимальным score
  let maxIntent: IntentType = 'unknown';
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxIntent = intent as IntentType;
    }
  }

  // Нормализуем confidence (max 1.0)
  const confidence = Math.min(maxScore, 1);

  return {
    intent: maxIntent,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    entities,
  };
}

/**
 * Определение уровня тяжести симптомов
 */
function detectSeverity(input: string): SeverityLevel {
  for (const keyword of SEVERITY_KEYWORDS.critical) {
    if (input.includes(keyword)) return 'critical';
  }
  for (const keyword of SEVERITY_KEYWORDS.high) {
    if (input.includes(keyword)) return 'high';
  }
  for (const keyword of SEVERITY_KEYWORDS.medium) {
    if (input.includes(keyword)) return 'medium';
  }
  return 'low';
}

/**
 * AI-based классификация через Ollama
 */
async function classifyWithAI(userInput: string): Promise<IntentClassificationResult> {
  const systemPrompt = `Ты - система классификации намерений для медицинской клиники.
Проанализируй сообщение пациента и определи его намерение.

Возможные намерения:
1. appointment - запись на приём к врачу (создание, отмена, перенос записи)
2. consultation - консультация по симптомам (описание жалоб, вопросы о здоровье)
3. info - справочная информация (часы работы, адрес, цены, услуги)
4. emergency - экстренная ситуация (угроза жизни, острая боль)
5. greeting - приветствие

Ответь в формате JSON:
{
  "intent": "appointment|consultation|info|emergency|greeting",
  "confidence": 0.0-1.0,
  "subIntent": "опционально: book|cancel|reschedule для appointment",
  "specialty": "опционально: специальность врача",
  "symptoms": ["опционально: массив симптомов"],
  "severity": "low|medium|high|critical"
}

Отвечай ТОЛЬКО JSON без дополнительного текста.`;

  try {
    const response = await ollama.generate(userInput, systemPrompt);
    const parsed = JSON.parse(response.trim());

    return {
      intent: parsed.intent || 'unknown',
      confidence: parsed.confidence || 0.5,
      confidenceLevel: getConfidenceLevel(parsed.confidence || 0.5),
      subIntent: parsed.subIntent,
      entities: {
        specialty: parsed.specialty,
        symptoms: parsed.symptoms,
        severity: parsed.severity,
      },
      rawAnalysis: response,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return {
      intent: 'unknown',
      confidence: 0.3,
      confidenceLevel: 'low',
      entities: {},
    };
  }
}

/**
 * Комбинирование результатов keyword и AI классификации
 */
function mergeResults(
  keywordResult: IntentClassificationResult,
  aiResult: IntentClassificationResult
): IntentClassificationResult {
  // AI имеет приоритет если его confidence выше
  if (aiResult.confidence > keywordResult.confidence) {
    return {
      ...aiResult,
      entities: {
        ...keywordResult.entities,
        ...aiResult.entities,
      },
    };
  }

  // Иначе усредняем
  const avgConfidence = (keywordResult.confidence + aiResult.confidence) / 2;

  return {
    intent: keywordResult.confidence >= aiResult.confidence
      ? keywordResult.intent
      : aiResult.intent,
    confidence: avgConfidence,
    confidenceLevel: getConfidenceLevel(avgConfidence),
    subIntent: aiResult.subIntent || keywordResult.subIntent,
    entities: {
      ...keywordResult.entities,
      ...aiResult.entities,
    },
    rawAnalysis: aiResult.rawAnalysis,
  };
}

/**
 * Получение уровня уверенности по числовому значению
 */
function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= DEFAULT_CONFIG.confidenceThreshold.high) return 'high';
  if (confidence >= DEFAULT_CONFIG.confidenceThreshold.medium) return 'medium';
  return 'low';
}

/**
 * Извлечение специальности из текста
 */
export function extractSpecialty(input: string): string | undefined {
  const normalizedInput = input.toLowerCase();

  for (const [, specialty] of Object.entries(MEDICAL_SPECIALTIES)) {
    for (const keyword of specialty.keywords) {
      if (normalizedInput.includes(keyword)) {
        return specialty.ru;
      }
    }
  }

  return undefined;
}

/**
 * Извлечение даты и времени из текста
 */
export function extractDateTime(input: string): { date?: string; time?: string } {
  const result: { date?: string; time?: string } = {};

  // Относительные даты
  if (input.includes('сегодня')) {
    result.date = new Date().toISOString().split('T')[0];
  } else if (input.includes('завтра')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.date = tomorrow.toISOString().split('T')[0];
  } else if (input.includes('послезавтра')) {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    result.date = dayAfter.toISOString().split('T')[0];
  }

  // Дни недели
  const weekdays = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
  for (let i = 0; i < weekdays.length; i++) {
    if (input.includes(weekdays[i])) {
      const today = new Date();
      const currentDay = today.getDay();
      const targetDay = i + 1; // Monday = 1
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      today.setDate(today.getDate() + daysToAdd);
      result.date = today.toISOString().split('T')[0];
      break;
    }
  }

  // Время (простой паттерн)
  const timeMatch = input.match(/(\d{1,2})[:\s]?(\d{2})?\s*(утра|дня|вечера)?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] || '00';
    const period = timeMatch[3];

    if (period === 'вечера' && hour < 12) hour += 12;
    if (period === 'дня' && hour < 12 && hour !== 12) hour += 12;

    result.time = `${hour.toString().padStart(2, '0')}:${minutes}`;
  }

  return result;
}
