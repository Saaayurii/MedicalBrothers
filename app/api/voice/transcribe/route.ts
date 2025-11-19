import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

/**
 * @swagger
 * /api/voice/transcribe:
 *   post:
 *     tags:
 *       - AI & Voice
 *     summary: Transcribe audio to text (Speech-to-Text)
 *     description: |
 *       Convert audio file to text using Deepgram STT API.
 *
 *       Features:
 *       - Russian language support
 *       - Automatic punctuation
 *       - Smart formatting
 *       - Confidence scores
 *
 *       Supported audio formats: WAV, MP3, M4A, FLAC, OGG
 *       Model: Nova-2 (optimized for Russian)
 *     operationId: transcribeAudio
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to transcribe
 *     responses:
 *       200:
 *         description: Audio transcribed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transcript:
 *                   type: string
 *                   description: Transcribed text
 *                   example: "У меня болит голова и температура тридцать восемь градусов."
 *                 confidence:
 *                   type: number
 *                   format: float
 *                   description: Transcription confidence score (0-1)
 *                   example: 0.95
 *       400:
 *         description: No audio file provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: No audio file provided
 *       500:
 *         description: Transcription failed or API key not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               notConfigured:
 *                 summary: API key not configured
 *                 value:
 *                   error: Deepgram API key not configured
 *               transcriptionFailed:
 *                 summary: Transcription failed
 *                 value:
 *                   error: Failed to transcribe audio
 */
export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Deepgram client with API key
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe audio using Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        language: 'ru',
        punctuate: true,
        smart_format: true,
        diarize: false,
      }
    );

    if (error) {
      console.error('Deepgram transcription error:', error);
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: 500 }
      );
    }

    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || '';

    return NextResponse.json({
      transcript,
      confidence: result?.results?.channels[0]?.alternatives[0]?.confidence || 0,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
