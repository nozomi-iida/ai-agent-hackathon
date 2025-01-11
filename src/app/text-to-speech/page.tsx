'use client';

import { useState } from 'react';
import { synthesizeSpeech } from './actions';

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await synthesizeSpeech(text);
      if ('error' in result) {
        alert(result.error);
        return;
      }
      
      // Base64をBlobに変換してaudio要素で再生できるようにする
      const audioBlob = new Blob(
        [Buffer.from(result.audioContent, 'base64')],
        { type: 'audio/mp3' }
      );
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">テキスト読み上げテスト</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-2 border rounded"
            placeholder="読み上げるテキストを入力してください"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? '生成中...' : '音声を生成'}
        </button>
      </form>
      {audioUrl && (
        <div className="mt-4">
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
} 
