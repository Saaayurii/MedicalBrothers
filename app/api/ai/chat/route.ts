import { NextRequest, NextResponse } from 'next/server';
import { ollama } from '@/lib/ollama';
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit';

const MEDICAL_SYSTEM_PROMPT = `Вы - медицинский AI ассистент клиники MedicalBrothers на базе модели Qwen.

Ваша роль:
- Помогать пациентам с общими вопросами о здоровье
- Давать рекомендации по симптомам (без постановки диагноза!)
- Помогать с записью на приём к врачу
- Отвечать на вопросы о работе клиники

Важно:
- Говорите на русском языке
- Будьте профессиональны и вежливы
- Не ставьте диагнозы - только рекомендации
- При серьезных симптомах направляйте к врачу немедленно
- Отвечайте кратко и по делу

Доступные специалисты:
- Терапевт
- Кардиолог
- Невролог
- Педиатр
- Эндокринолог
- Дерматолог

Часы работы: Пн-Пт 8:00-20:00, Сб-Вс 9:00-18:00`;

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     tags:
 *       - AI & Voice
 *     summary: Chat with Ollama AI (Qwen 2.5)
 *     description: |
 *       AI-powered medical consultation using locally hosted Ollama with Qwen 2.5 model.
 *
 *       Features:
 *       - Medical symptom analysis
 *       - Doctor specialty recommendations
 *       - Clinic information
 *       - Appointment booking guidance
 *
 *       Limitations:
 *       - No diagnosis - only recommendations
 *       - Rate limited: 100 requests/minute
 *       - Requires Ollama service running
 *     operationId: aiChat
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message/question
 *                 example: "У меня болит голова и температура 38"
 *               conversationHistory:
 *                 type: array
 *                 description: Previous conversation context (optional)
 *                 items:
 *                   $ref: '#/components/schemas/AIMessage'
 *                 example:
 *                   - role: user
 *                     content: "Здравствуйте"
 *                   - role: assistant
 *                     content: "Здравствуйте! Чем могу помочь?"
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                   description: AI assistant's response
 *                   example: "Головная боль и температура 38°C могут быть признаками простуды или ОРВИ. Рекомендую записаться к терапевту для осмотра."
 *                 model:
 *                   type: string
 *                   description: AI model used
 *                   example: "qwen2.5:7b"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Превышен лимит запросов
 *                 retryAfter:
 *                   type: integer
 *                   example: 60
 *       503:
 *         description: Ollama service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Ollama service is not available
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.API_STANDARD);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Превышен лимит запросов',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Ollama is available
    const isAvailable = await ollama.isAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Ollama service is not available' },
        { status: 503 }
      );
    }

    // Build messages array
    const messages = [
      { role: 'system' as const, content: MEDICAL_SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Get response from Ollama
    const response = await ollama.chat(messages);

    return NextResponse.json({
      response,
      model: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
