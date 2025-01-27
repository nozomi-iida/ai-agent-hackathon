'use client';

import { useState, useRef } from 'react';
import { calculateScore, startRecording, startTest } from './actions';
import { Button } from '@/components/ui/button';

export default function ConversationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<
    { role: 'user' | 'ai'; content: string }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [result, setResult] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleStartTest = async () => {
    setIsTestStarted(true);
    const response = await startTest();
    setConversation((prev) => [
      ...prev,
      { role: 'ai', content: response.aiResponse },
    ]);
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(
      Buffer.from(response.audioContent, 'base64').buffer,
    );
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const response = await startRecording(audioBlob);

        setConversation((prev) => [
          ...prev,
          { role: 'user', content: response.text },
        ]);

        setConversation((prev) => [
          ...prev,
          { role: 'ai', content: response.aiResponse },
        ]);

        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(
          Buffer.from(response.audioContent, 'base64').buffer,
        );
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);

        setIsProcessing(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsProcessing(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCalculateScore = async () => {
    setIsTestStarted(false);
    const response = await calculateScore();
    setResult(response.aiResponse);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">AI Conversation</h1>

      <div className="mb-4">
        {isTestStarted ? (
          <Button onClick={handleCalculateScore}>テスト完了</Button>
        ) : (
          <Button onClick={handleStartTest}>スタート</Button>
        )}
      </div>
      <div className="mb-4">
        <button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
          className={`rounded px-4 py-2 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {isProcessing
            ? 'Processing...'
            : isRecording
              ? 'Stop Recording'
              : 'Start Recording'}
        </button>
      </div>

      <div className="space-y-4">
        {conversation.map((message, index) => (
          <div key={index} className="max-w-[80%] rounded-lg p-4">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>
      {result && (
        <div className="mt-4 rounded-lg bg-gray-100 p-4">
          <h2 className="mb-2 text-xl font-bold">Result</h2>
          <p className="whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}
