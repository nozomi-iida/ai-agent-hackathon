"use server";

import { translate } from "@/libs/google-cloud/translate";
import { SpeechClient } from "@google-cloud/speech";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
	process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const chat = model.startChat({ history: [] });

export async function startTest() {
	const prompt = `
あなたは、英会話学習用の話相手です。
私の英文の発言に対して、以下の必ず条件で回答します。

- 10〜20 単語程度の英文で回答してください。
- あなたの回答には、私の発言に対する相槌を含めてください。
- あなたの回答には、私に対する質問を含めてください。
- あなたの回答には、あなたの立場を守って書いてください。
`;

	const result = await chat.sendMessage(prompt);
	console.log(await chat.getHistory());

	const aiResponse =
		result.response.text() || "申し訳ありません。応答を生成できませんでした。";

	const [audioResponse] = await textToSpeechClient.synthesizeSpeech({
		input: { text: aiResponse },
		voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
		audioConfig: {
			audioEncoding: "MP3",
			speakingRate: 1.0,
		},
	});

	return {
		aiResponse: aiResponse,
		audioContent: Buffer.from(
			audioResponse.audioContent as Uint8Array,
		).toString("base64"),
	};
}

export async function startRecording(audioBlob: Blob) {
	// Convert audio blob to base64
	const buffer = await audioBlob.arrayBuffer();
	const audioBytes = Buffer.from(buffer).toString("base64");

	// Configure the speech recognition request
	const audio = {
		content: audioBytes,
	};
	const config = {
		encoding: "WEBM_OPUS" as const,
		sampleRateHertz: 48000,
		languageCode: "en-US",
	};
	const request = {
		audio: audio,
		config: config,
	};

	// Perform the speech recognition
	const [response] = await speechClient.recognize(request);
	const transcription =
		response.results
			?.map((result) => result.alternatives?.[0]?.transcript)
			.join("\n") || "";

	// Get AI response using Gemini
	const prompt = `${transcription}`;

	const result = await chat.sendMessage(prompt);
	const aiResponse =
		result.response.text() || "申し訳ありません。応答を生成できませんでした。";
	// Convert AI response to speech
	const [audioResponse] = await textToSpeechClient.synthesizeSpeech({
		input: { text: aiResponse },
		voice: { languageCode: "en-US", ssmlGender: "NEUTRAL" },
		audioConfig: {
			audioEncoding: "MP3",
			speakingRate: 1.0,
		},
	});

	return {
		text: transcription,
		aiResponse: aiResponse,
		audioContent: Buffer.from(
			audioResponse.audioContent as Uint8Array,
		).toString("base64"),
	};
}

export const translateText = async (text: string) => {
	/* 英語を日本語に翻訳する */
	const result = await translate.translate(text, "ja");
	const translations = Array.isArray(result) ? result : [result];

	return translations[0];
};
