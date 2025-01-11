'use client';

import { useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { transcribeAudio } from './actions';

export default function SpeechToText() {
  const [transcription, setTranscription] = useState<string>('');
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
    onStop: async (blobUrl, blob) => {
      try {
        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const audioBytes = base64Audio.split(',')[1];

          const result = await transcribeAudio(audioBytes);
          if ('error' in result) {
            setTranscription(result.error || 'エラーが発生しました。');
          } else {
            setTranscription(result.transcription || '音声を認識できませんでした。');
          }
        };
      } catch (error) {
        console.error('Error transcribing audio:', error);
        setTranscription('エラーが発生しました。');
      }
    },
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">音声認識テスト</h1>
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={startRecording}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={status === 'recording'}
          >
            録音開始
          </button>
          <button
            onClick={stopRecording}
            className="bg-red-500 text-white px-4 py-2 rounded"
            disabled={status !== 'recording'}
          >
            録音停止
          </button>
        </div>
        {mediaBlobUrl && (
          <audio src={mediaBlobUrl} controls className="w-full" />
        )}
        <div className="mt-4">
          <h2 className="text-xl font-semibold">認識結果:</h2>
          <p className="mt-2 p-4 bg-gray-100 rounded">{transcription || '音声を録音してください'}</p>
        </div>
      </div>
    </div>
  );
} 
