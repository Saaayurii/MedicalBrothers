// Ollama client for Qwen model

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:latest';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateResponse(messages: Message[]): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Error calling Ollama:', error);
    throw error;
  }
}

export async function analyzeIntent(userInput: string): Promise<{
  intent: 'appointment' | 'consultation' | 'info' | 'emergency' | 'greeting' | 'unknown';
  confidence: number;
  entities: Record<string, any>;
}> {
  const systemPrompt = `Ты - анализатор намерений для медицинского голосового помощника.
Определи намерение пользователя из следующих категорий:
- appointment: запись на приём к врачу
- consultation: консультация по симптомам
- info: справочная информация (режим работы, цены, услуги)
- emergency: экстренная ситуация, вызов скорой
- greeting: приветствие
- unknown: неизвестное намерение

Также извлеки важные сущности (имена врачей, специальности, симптомы, даты).

Ответь в формате JSON:
{
  "intent": "тип намерения",
  "confidence": 0.95,
  "entities": {
    "specialty": "кардиолог",
    "doctor_name": "Иван Петров",
    "symptoms": ["головная боль", "температура"],
    "date": "завтра"
  }
}`;

  try {
    const response = await generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ]);

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback
    return {
      intent: 'unknown',
      confidence: 0.5,
      entities: {},
    };
  } catch (error) {
    console.error('Error analyzing intent:', error);
    return {
      intent: 'unknown',
      confidence: 0,
      entities: {},
    };
  }
}

export async function generateMedicalAdvice(symptoms: string): Promise<string> {
  const systemPrompt = `Ты - медицинский консультант AI.
Пациент описывает свои симптомы. Твоя задача:
1. Проанализировать симптомы
2. Определить возможные причины (не диагноз!)
3. Оценить срочность (низкая, средняя, высокая, экстренная)
4. Порекомендовать специалиста
5. Дать общие рекомендации

ВАЖНО: Ты НЕ ставишь диагнозы! Только даёшь общую информацию и рекомендуешь обратиться к врачу.

Ответь понятным языком, дружелюбно и с заботой о пациенте.`;

  try {
    return await generateResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Симптомы: ${symptoms}` },
    ]);
  } catch (error) {
    console.error('Error generating medical advice:', error);
    return 'Извините, не могу обработать запрос. Рекомендую обратиться к врачу напрямую.';
  }
}
