'use server';

import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';

export async function synthesizeSpeech(text: string) {
  try {
    const credentials = JSON.parse(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string,
    );
    const client = new TextToSpeechClient({
      credentials,
    });

    const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest =
      {
        input: { text },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' as const },
        audioConfig: { audioEncoding: 'MP3' as const },
      };

    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    if (!audioContent) {
      throw new Error('音声の生成に失敗しました。');
    }

    // Base64エンコードして返す
    return {
      audioContent: Buffer.from(audioContent as Uint8Array).toString('base64'),
    };
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    return { error: 'エラーが発生しました。' };
  }
}
