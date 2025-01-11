'use server';

import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { GoogleGenerativeAI } from '@google/generative-ai';

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string);

const speechClient = new SpeechClient({
  credentials,
});

const textToSpeechClient = new TextToSpeechClient({
  credentials,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function startRecording(audioBlob: Blob) {
  // Convert audio blob to base64
  const buffer = await audioBlob.arrayBuffer();
  const audioBytes = Buffer.from(buffer).toString('base64');

  // Configure the speech recognition request
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'WEBM_OPUS' as const,
    sampleRateHertz: 48000,
    languageCode: 'ja-JP',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Perform the speech recognition
  const [response] = await speechClient.recognize(request);
  const transcription = response.results
    ?.map(result => result.alternatives?.[0]?.transcript)
    .join('\n') || '';

  // Get AI response using Gemini
  const prompt = `あなたは親切で役立つAIアシスタントです。以下のユーザーの質問に対して、簡潔で分かりやすい日本語で回答してください：

${transcription}`;

  const result = await model.generateContent(prompt);
  const aiResponse = result.response.text() || "申し訳ありません。応答を生成できませんでした。";

  // Convert AI response to speech
  const [audioResponse] = await textToSpeechClient.synthesizeSpeech({
    input: { text: aiResponse },
    voice: { languageCode: 'ja-JP', ssmlGender: 'NEUTRAL' },
    audioConfig: { 
      audioEncoding: 'MP3',
      speakingRate: 1.3
    },
  });

  return {
    text: transcription,
    aiResponse: aiResponse,
    audioContent: Buffer.from(audioResponse.audioContent as Uint8Array).toString('base64'),
  };
} 
