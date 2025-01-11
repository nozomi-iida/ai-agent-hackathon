'use server';

import { jsonModal } from '@/libs/generative-ai/client';

export const askRecipe = async (prevState: Recipe[], formData: FormData) => {
  const prompt = formData.get('prompt') as string;

  const result = await jsonModal.generateContent(prompt);

  return JSON.parse(result.response.text()) as Recipe[];
};
