import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// System prompt for medical assistant
const SYSTEM_PROMPT = `Вы - медицинский голосовой ассистент клиники MedicalBrothers. Ваша задача:
1. Помогать пациентам записаться на приём к врачу
2. Отвечать на общие вопросы о работе клиники
3. Давать базовые рекомендации по здоровью (без диагностики!)
4. Собирать информацию о симптомах для последующей консультации

Важно:
- Будьте вежливы и профессиональны
- Не ставьте диагнозы
- При серьёзных симптомах рекомендуйте срочную консультацию
- Говорите коротко и по делу
- Используйте простой язык

Доступные специалисты в клинике:
- Терапевт
- Кардиолог
- Невролог
- Педиатр
- Эндокринолог
- Дерматолог

Часы работы: Пн-Пт 8:00-20:00, Сб-Вс 9:00-18:00
Адрес: г. Москва, ул. Примерная, д. 123
Телефон: +7 (495) 123-45-67`;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.VOICE_API);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Превышен лимит запросов. Попробуйте позже.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RateLimitPresets.VOICE_API.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          },
        }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation messages for OpenAI
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'Извините, я не смог обработать ваш запрос.';

    // Analyze if this is an appointment request
    const isAppointmentRequest = await detectAppointmentIntent(message);

    // Save consultation to database (if needed)
    try {
      await prisma.consultation.create({
        data: {
          patientId: 1, // TODO: Get from session
          symptoms: message,
          aiResponse: assistantMessage,
          severityLevel: detectSeverityLevel(message),
          recommendedSpecialty: isAppointmentRequest ? extractSpecialty(message) : null,
        },
      });
    } catch (dbError) {
      console.error('Database error (consultation save):', dbError);
      // Continue even if DB save fails
    }

    return NextResponse.json({
      response: assistantMessage,
      isAppointmentRequest,
      specialty: isAppointmentRequest ? extractSpecialty(message) : null,
    });
  } catch (error: any) {
    console.error('OpenAI chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to detect if user wants to make an appointment
async function detectAppointmentIntent(message: string): Promise<boolean> {
  const keywords = ['записать', 'запись', 'приём', 'прием', 'консультация', 'врач', 'доктор'];
  const lowerMessage = message.toLowerCase();
  return keywords.some(keyword => lowerMessage.includes(keyword));
}

// Extract specialty from message
function extractSpecialty(message: string): string | null {
  const specialties: Record<string, string[]> = {
    'Терапевт': ['терапевт', 'общий'],
    'Кардиолог': ['кардиолог', 'сердце', 'давление'],
    'Невролог': ['невролог', 'голова', 'головная боль', 'мигрень'],
    'Педиатр': ['педиатр', 'ребенок', 'дети'],
    'Эндокринолог': ['эндокринолог', 'гормоны', 'щитовидка'],
    'Дерматолог': ['дерматолог', 'кожа', 'сыпь'],
  };

  const lowerMessage = message.toLowerCase();

  for (const [specialty, keywords] of Object.entries(specialties)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return specialty;
    }
  }

  return null;
}

// Detect severity level from symptoms
function detectSeverityLevel(message: string): string {
  const emergencyKeywords = ['не могу дышать', 'боль в груди', 'кровотечение', 'потерял сознание', 'инфаркт', 'инсульт'];
  const highKeywords = ['сильная боль', 'высокая температура', 'рвота', 'диарея'];

  const lowerMessage = message.toLowerCase();

  if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'emergency';
  }

  if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'high';
  }

  return 'normal';
}
