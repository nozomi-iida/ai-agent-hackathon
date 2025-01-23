'use client';

import { useState, useRef } from 'react';
import { startRecording, startTest, translateText } from './actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/classNames';

export default function ConversationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<
    { role: 'user' | 'ai'; content: string }[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);
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

  const onTranslate = async (text: string) => {
    const result = await translateText(text);

    console.log('Translated:', result);
  };

  return (
    <div className="flex-grow p-4">
      <h1 className="mb-4 text-center text-2xl font-bold">AI Conversation</h1>
      <div className="flex justify-center space-x-4">
        <Button
          variant="secondary"
          onClick={handleStartTest}
          disabled={isTestStarted}
        >
          スタート
        </Button>
        <Button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
          className={cn(
            'rounded px-4 py-2',
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600',
            isProcessing ? 'cursor-not-allowed opacity-50' : '',
          )}
        >
          {isProcessing
            ? 'Processing...'
            : isRecording
              ? 'Stop Recording'
              : 'Start Recording'}
        </Button>
      </div>

      <div className="space-y-2">
        {conversation.map((message, index) => (
          <div key={index}>
            <div
              className={cn(
                'py-1 text-xs text-zinc-500 dark:text-zinc-400',
                message.role === 'ai' ? 'text-left' : 'text-right',
              )}
            >
              {message.role === 'ai' ? 'interviewer' : 'you'}
            </div>
            <p
              className={cn(
                'whitespace-pre-wrap rounded-t-2xl border p-4',
                message.role === 'ai'
                  ? 'w-fit rounded-br-2xl text-left'
                  : 'ml-auto w-fit rounded-bl-2xl text-right',
              )}
            >
              {message.content}
            </p>

            <Button
              variant="secondary"
              onClick={() => onTranslate(message.content)}
            >
              翻訳
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
