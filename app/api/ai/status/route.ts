
import { NextRequest, NextResponse } from 'next/server';
import { checkOllamaAvailability } from '@/lib/medical-ai';

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     tags:
 *       - AI & Voice
 *     summary: Check AI service status
 *     description: |
 *       Check if the local Ollama/Qwen AI service is available.
 *       Returns the status and available model information.
 *     operationId: checkAIStatus
 *     security: []
 *     responses:
 *       200:
 *         description: AI service status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                   description: Whether the AI service is available
 *                 model:
 *                   type: string
 *                   description: The active AI model
 *                 provider:
 *                   type: string
 *                   description: The AI provider name
 *             example:
 *               available: true
 *               model: "qwen2.5:7b"
 *               provider: "Ollama (local)"
 *       500:
 *         description: AI service not available
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 error:
 *                   type: string
 *             example:
 *               available: false
 *               error: "Ollama не запущен"
 */
export async function GET(request: NextRequest) {
  try {
    const status = await checkOllamaAvailability();

    if (status.available) {
      return NextResponse.json({
        available: true,
        model: status.model,
        provider: 'Ollama (local)',
        message: 'AI сервис доступен для обработки симптомов'
      });
    }

    return NextResponse.json({
      available: false,
      error: status.error,
      fallback: 'keyword-based',
      message: 'AI сервис недоступен, используется резервный метод'
    }, { status: 503 });

  } catch (error: any) {
    return NextResponse.json({
      available: false,
      error: error.message,
      fallback: 'keyword-based'
    }, { status: 500 });
  }
}
