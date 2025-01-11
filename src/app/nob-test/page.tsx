import { defaultModel } from '@/libs/generative-ai/client';
import Form from 'next/form';

export default function Home() {
  const action = async () => {
    'use server';
    const prompt = `List a few popular cookie recipes using this JSON schema:
  
  Recipe = {'recipeName': string}
  Return: Array<Recipe>`;

    const result = await defaultModel.generateContent(prompt);
    console.log(result.response);
    console.log(result.response.text());
  };

  return (
    <div className="">
      <div>のぶテスト</div>
      <Form action={action}>
        <button type="submit">Submit</button>
      </Form>
    </div>
  );
}
