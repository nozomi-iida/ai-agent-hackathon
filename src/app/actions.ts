'use server';

import { translate } from '@/libs/google-cloud/translate';
import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { GoogleGenerativeAI } from '@google/generative-ai';

const credentials = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string,
);

const speechClient = new SpeechClient({
  credentials,
});

const textToSpeechClient = new TextToSpeechClient({
  credentials,
});

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const chat = model.startChat({ history: [] });

export async function textToSpeak(text: string, lang = 'en-US') {
  const [audioResponse] = await textToSpeechClient.synthesizeSpeech({
    input: { text },
    voice: { languageCode: lang, ssmlGender: 'NEUTRAL' },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
    },
  });

  return audioResponse;
}

export async function startTest() {
  const prompt = `
あなたはIELTSスピーキングテストの試験官です。
私の英文の発言に対して、以下のフォーマットで1回に1つずつ回答します。

#出力フォーマット
英語
アスタリスク(*)は絶対につけない

#会話の開始
私にIELTSのスピーキングテストの質問をしてください。

#絶対的な制約
毎回、必ず上記の出力フォーマットを厳格に守って全てを必ず出力してください。
`;

  const result = await chat.sendMessage(prompt);
  const aiResponse =
    result.response.text() || '申し訳ありません。応答を生成できませんでした。';
  const audioResponse = await textToSpeak(aiResponse);

  return {
    aiResponse: aiResponse,
    audioContent: Buffer.from(
      audioResponse.audioContent as Uint8Array,
    ).toString('base64'),
  };
}

export async function startRecording(audioBlob: Blob) {
  const buffer = await audioBlob.arrayBuffer();
  const audioBytes = Buffer.from(buffer).toString('base64');

  const audio = {
    content: audioBytes,
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

  const [response] = await speechClient.recognize(request);
  const transcription =
    response.results
      ?.map((result) => result.alternatives?.[0]?.transcript)
      .join('\n') || '';

  const prompt = `${transcription}`;

  const result = await chat.sendMessage(prompt);
  const aiResponse =
    result.response.text() || '申し訳ありません。応答を生成できませんでした。';
  const audioResponse = await textToSpeak(aiResponse);

  return {
    text: transcription,
    aiResponse: aiResponse,
    audioContent: Buffer.from(
      audioResponse.audioContent as Uint8Array,
    ).toString('base64'),
  };
}

export async function calculateScore() {
  const history = await chat.getHistory();
  const prompt = `
IELTSのスピーキングテストはこれで終了になります。

#出力項目
ユーザーのスコアを計算してください。
下に示す評価基準を参考に私の過去の発言にに対して、スコアと、スコアをアップするためのアドバイスを出力してください。

#評価基準
スコア9.0
文法
- 全範囲の構文を自然かつ柔軟に使用している
- ネイティブスピーカーのうっかり間違いを除いて、正確な構文を生成できる 
単語
- 全トピックにおいて柔軟かつ正確に使用している
- イディオムを自然かつ正確に使用している
流暢さ
- ごく稀に繰り返しや言い直しはある
- 口ごもりは話す内容によるもので、言葉を探しているわけではない
- つながり語を適切に使用している
- トピックを完璧に適切に展開できるスコア8.0
文法
- 幅広い構文を柔軟に使用している
- 様々な複文をある程度の柔軟性で使用している
単語
- 容易かつ柔軟に幅広い語彙を使える
- レベルの高い語彙やイディオムを巧みに使っているが、時に不正確さを伴う
- 必要な場面で効果的に言い換えをしている
流暢さ
- 時に繰り返しや言い直しはあるが流暢に話せる
- 口ごもりは話す内容によるもので、言葉を探すことはまれ
- トピックから逸脱せず適切に展開できる
スコア7.0
文法
- 間違いのない文章が多いが、いくつかの文法の間違いも残る
- 単文と複文を併用しているが、柔軟性は限定的
単語
- 明らかな努力なしに一貫性を失うことなく長い文章を話せる
- 言語に関連する口ごもりが時々見られ、繰り返しや言い直しもある
- さまざまな接続語や談話標識をある程度の柔軟性を持って使用できる
流暢さ
- 明らかな努力なしに一貫性を失うことなく長い文章を話せる
- 言語に関連する口ごもりが時々見られ、繰り返しや言い直しもある
- さまざまな接続語や談話標識をある程度の柔軟性を持って使用できる
スコア6.0
文法
- 複文では、しばしば間違いがあるが意味を阻害することはまれ
- 基本的な文章をそれなりの正確性をもって話せる
単語
- 長く話すことに意欲を感じるが、繰り返し、言い直し、口ごもりによりしばしば一貫性を失いがち
- さまざまな接続語や談話標識を使用しているが適切ではない
流暢さ
- 長く話すことに意欲を感じるが、繰り返し、言い直し、口ごもりによりしばしば一貫性を失いがち
- さまざまな接続語や談話標識を使用しているが適切ではない
スコア5.0
文法
- 不適切さや基本的な間違いはまれ
- 基本的な文章はいくらかの正確性をもって話せる
単語
- 概ねスピーチの流れを維持できるが、スロースピーチが見られる
- 接続語や談話標識を過剰に使用している
- 単純なスピーチは流暢に話せるが、複雑な会話では流暢さが落ちる
流暢さ
- 概ねスピーチの流れを維持できるが、スロースピーチが見られる
- 接続語や談話標識を過剰に使用している
- 単純なスピーチは流暢に話せるが、複雑な会話では流暢さが落ちる
スコア4.0
文法
- 複文の使用はまれ
- 間違いが多く、理解に不和が生じる
- 顕著なポーズがなしでは答えられない。
単語
- 繰り返し、言い直し、スロースピーチが見られる
- 単調な談話標識を過剰に使用して一貫性が途切れる
流暢さ
- 顕著なポーズがなしでは答えられない。
- り返し、言い直し、スロースピーチが見られる
- 単調な談話標識を過剰に使用して一貫性が途切れる

#出力フォーマット
日本語で書いて
マークダウン形式で書いて

#絶対的な制約
毎回、必ず上記の出力フォーマットを厳格に守って全てを必ず出力してください。
`;

  const result = await model.generateContent([
    ...history
      .flatMap((message) => message.parts.flatMap((part) => part.text))
      .join('\n'),
    prompt,
  ]);
  const aiResponse =
    result.response.text() || '申し訳ありません。応答を生成できませんでした。';
  await model.startChat({ history: [] });
  return {
    aiResponse: aiResponse,
  };
}

export const translateText = async (text: string) => {
  /* 英語を日本語に翻訳する */
  const result = await translate.translate(text, 'ja');
  const translations = Array.isArray(result) ? result : [result];

  return translations[0];
};

export const textToAudioContent = async (text: string) => {
  const audioResponse = await textToSpeak(text);
  return Buffer.from(audioResponse.audioContent as Uint8Array).toString(
    'base64',
  );
};
