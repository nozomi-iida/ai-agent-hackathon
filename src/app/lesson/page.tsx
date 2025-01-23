'use client';

import { useState, useRef } from 'react';
import { startRecording, startTest, translateText } from './actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/classNames';
import { Progress } from '@/components/ui/progress';
import { BsFillMicFill } from 'react-icons/bs';
import { MdGTranslate } from 'react-icons/md';
import { FaPlay } from 'react-icons/fa6';

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

  const [translates, setTranslates] = useState<string[]>([]);

  const onTranslate = async (index: number, text: string) => {
    const result = await translateText(text);
    const newTranslates = [...translates];
    newTranslates[index] = result;
    setTranslates(newTranslates);
  };

  return (
    <div className="relative flex w-full flex-grow flex-col pb-20">
      <Progress className="h-2 rounded-none [&>div]:bg-blue-500" value={33} />
      <h1 className="mb-4 py-4 text-center text-2xl font-bold">Lesson</h1>

      <div
        className={cn(
          'flex flex-grow flex-col',
          conversation.length === 0 ? 'items-center justify-center' : 'p-4',
        )}
      >
        {conversation.length > 0 ? (
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
                <div
                  className={cn(
                    'space-y-2 whitespace-pre-wrap rounded-t-2xl border p-4',
                    message.role === 'ai'
                      ? 'w-fit rounded-br-2xl text-left'
                      : 'ml-auto w-fit rounded-bl-2xl text-right',
                  )}
                >
                  <p>{message.content}</p>
                  {translates[index] && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {translates[index]}
                    </p>
                  )}
                  {message.role === 'ai' && (
                    <div className="flex justify-end gap-x-3">
                      <Button
                        className="rounded-full bg-blue-600 [&_svg]:size-5"
                        size="icon"
                        variant="secondary"
                        onClick={() => onTranslate(index, message.content)}
                      >
                        <MdGTranslate className="fill-white" />
                      </Button>
                      <Button
                        className="rounded-full"
                        size="icon"
                        variant="secondary"
                      >
                        <FaPlay className="fill-white pl-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !isTestStarted ? (
          <div className="mx-auto w-fit">
            <Button
              size="lg"
              onClick={handleStartTest}
              disabled={isTestStarted}
            >
              スタート
            </Button>
          </div>
        ) : (
          <div className="animate-pulse">Waiting...</div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 flex w-full justify-center space-x-4 border-t p-4">
        <Button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          variant={isRecording ? 'destructive' : 'default'}
          disabled={!isTestStarted || isProcessing}
          className={cn(
            'rounded px-4 py-2',
            isProcessing ? 'cursor-not-allowed opacity-50' : '',
          )}
        >
          {isRecording && <BsFillMicFill />}
          {isProcessing
            ? 'Processing...'
            : isRecording
              ? 'Stop Recording'
              : 'Start Recording'}
        </Button>
      </div>
    </div>
  );
}
