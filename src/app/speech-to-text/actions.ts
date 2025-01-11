'use server';

import { SpeechClient } from '@google-cloud/speech';

export async function transcribeAudio(audioBase64: string) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string);
    
    const client = new SpeechClient({
      credentials,
    });
    
    const audio = {
      content: audioBase64,
    };
    const config = {
      encoding: 'WEBM_OPUS' as const,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    };
    
    const request = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      ?.map((result) => result.alternatives?.[0].transcript)
      .join('\n');

    return { transcription: transcription || '音声を認識できませんでした。' };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return { error: 'エラーが発生しました。' };
  }
} 
