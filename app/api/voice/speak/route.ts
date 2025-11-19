import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * @swagger
 * /api/voice/speak:
 *   post:
 *     tags:
 *       - AI & Voice
 *     summary: Convert text to speech (Text-to-Speech)
 *     description: |
 *       Generate natural-sounding speech audio from text using OpenAI TTS API.
 *
 *       Features:
 *       - High-quality voice synthesis
 *       - Russian language support
 *       - Configurable speed
 *       - Multiple voice options
 *
 *       Model: TTS-1 (optimized for latency)
 *       Voice: Alloy (neutral, clear)
 *       Output format: MP3
 *     operationId: textToSpeech
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to convert to speech
 *                 example: "Здравствуйте! Чем могу вам помочь?"
 *     responses:
 *       200:
 *         description: Audio generated successfully
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *               description: MP3 audio file
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: audio/mpeg
 *           Content-Length:
 *             schema:
 *               type: integer
 *               description: Audio file size in bytes
 *       400:
 *         description: Text is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Text is required
 *       500:
 *         description: TTS generation failed or API key not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notConfigured:
 *                 summary: API key not configured
 *                 value:
 *                   error: OpenAI API key not configured
 *               ttsFailed:
 *                 summary: TTS generation failed
 *                 value:
 *                   error: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      speed: 1.0,
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Return audio file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
