import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * FREE Text-to-Speech using Piper TTS (offline, no API keys needed)
 *
 * @swagger
 * /api/voice/piper-speak:
 *   post:
 *     tags:
 *       - AI & Voice
 *     summary: Convert text to speech using FREE Piper TTS
 *     description: |
 *       Generate natural-sounding speech audio using Piper TTS (completely free, offline).
 *
 *       Features:
 *       - 100% FREE (no API keys needed)
 *       - Works offline
 *       - High-quality Russian voice
 *       - Fast generation
 *       - No rate limits
 *
 *       Model: ru_RU-ruslan-medium
 *       Output format: WAV
 *     operationId: piperTextToSpeech
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
 *                 description: Text to convert to speech (Russian)
 *                 example: "Здравствуйте! Чем могу вам помочь?"
 *     responses:
 *       200:
 *         description: Audio generated successfully
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Text is required
 *       500:
 *         description: TTS generation failed or Piper not installed
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Paths
    const projectRoot = process.cwd();
    const piperPath = path.join(projectRoot, 'venv', 'bin', 'piper');
    const modelPath = path.join(projectRoot, 'models', 'ru_RU-ruslan-medium.onnx');

    // Check if Piper is installed
    if (!fs.existsSync(piperPath)) {
      console.error('Piper not found at:', piperPath);
      return NextResponse.json(
        {
          error: 'Piper TTS not installed in venv. Run: source venv/bin/activate && pip install piper-tts',
          piperPath
        },
        { status: 500 }
      );
    }

    // Check if model exists
    if (!fs.existsSync(modelPath)) {
      console.error('Model not found at:', modelPath);
      return NextResponse.json(
        {
          error: 'Russian model not downloaded. Model should be at: models/ru_RU-ruslan-medium.onnx',
          modelPath
        },
        { status: 500 }
      );
    }

    // Create temp file for audio output
    const tempFile = path.join('/tmp', `piper_tts_${Date.now()}.wav`);

    // Escape text for shell
    const escapedText = text.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');

    // Generate speech using Piper
    const piperCommand = `echo "${escapedText}" | ${piperPath} --model ${modelPath} --output_file ${tempFile}`;

    console.log('Running Piper TTS:', piperCommand.substring(0, 100) + '...');

    try {
      const { stdout, stderr } = await execAsync(piperCommand, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      if (stderr) {
        console.log('Piper stderr:', stderr);
      }
    } catch (error: any) {
      console.error('Piper TTS execution error:', error);
      return NextResponse.json(
        {
          error: 'Failed to generate speech',
          details: error.message,
          stderr: error.stderr,
        },
        { status: 500 }
      );
    }

    // Check if audio file was created
    if (!fs.existsSync(tempFile)) {
      return NextResponse.json(
        { error: 'Audio file was not generated' },
        { status: 500 }
      );
    }

    // Read audio file
    const audioBuffer = fs.readFileSync(tempFile);

    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (error) {
      console.error('Failed to delete temp file:', error);
    }

    console.log('✅ Piper TTS generated audio:', audioBuffer.length, 'bytes');

    // Return audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Piper TTS error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
