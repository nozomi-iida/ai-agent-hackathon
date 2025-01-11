'use server';

import { defaultModel } from '@/libs/generative-ai/client';

export const action = async () => {
  const prompt = `List a few popular cookie recipes using this JSON schema:

Recipe = {'recipeName': string}
Return: Array<Recipe>`;

  const result = await defaultModel.generateContent(prompt);
  console.log(result.response);
  console.log(result.response.text());
};
