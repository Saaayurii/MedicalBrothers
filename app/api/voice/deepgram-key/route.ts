import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/voice/deepgram-key:
 *   get:
 *     tags:
 *       - AI & Voice
 *     summary: Get Deepgram API key for client-side streaming
 *     description: Returns the Deepgram API key for client-side live transcription
 *     operationId: getDeepgramKey
 *     security: []
 *     responses:
 *       200:
 *         description: API key returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                   description: Deepgram API key
 *       500:
 *         description: API key not configured
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Deepgram API key not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({ key: apiKey });
}
