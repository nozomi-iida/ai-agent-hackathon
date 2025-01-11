import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ''
);

export const defaultModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
});

const schema = {
  description: 'List of recipes',
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      recipeName: {
        type: SchemaType.STRING,
        description: 'Name of the recipe',
        nullable: false,
      },
    },
    required: ['recipeName'],
  },
};
export const jsonModal = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: schema,
  },
});
