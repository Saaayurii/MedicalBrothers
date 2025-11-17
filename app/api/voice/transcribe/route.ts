import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

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
