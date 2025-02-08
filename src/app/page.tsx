'use client';

import { useState, useRef } from 'react';
import {
  calculateScore,
  startRecording,
  startTest,
  textToAudioContent,
  translateText,
} from './actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/libs/classNames';
import { Progress } from '@/components/ui/progress';
import { MdGTranslate } from 'react-icons/md';
import { FaPhone, FaPhoneSlash, FaPlay } from 'react-icons/fa6';
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

const ANSWER_COUNT = 7;

export default function ConversationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<
    { role: 'user' | 'ai'; content: string }[]
  >([]);
  const answerCount = conversation.filter(
    (message) => message.role === 'user',
  ).length;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [result, setResult] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const playAudio = async (content: string) => {
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(
      Buffer.from(content, 'base64').buffer,
    );
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  };

  const addConversation = (role: 'user' | 'ai', content: string) => {
    setConversation((prev) => [...prev, { role, content }]);
  };

  const handleStartTest = async () => {
    setIsTestStarted(true);
    const response = await startTest();
    addConversation('ai', response.aiResponse);
    playAudio(response.audioContent);
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
        if (!response.text) {
          setIsProcessing(false);
          return;
        }

        addConversation('user', response.text);
        if (answerCount + 1 === ANSWER_COUNT) {
          const score = await calculateScore();
          setResult(score.aiResponse);
        } else {
          addConversation('ai', response.aiResponse);
          await playAudio(response.audioContent);
        }
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

  const handleResetConversation = async () => {
    const res = await calculateScore();
    setResult(res.aiResponse);
    setConversation([]);
    setIsTestStarted(false);
    setResult('');
    setTranslates([]);
    setIsRecording(false);
  };

  const handleReplyAudio = async (content: string) => {
    const audioContent = await textToAudioContent(content);
    await playAudio(audioContent);
  };

  return (
    <div className="relative flex w-full flex-grow flex-col pb-20">
      <Progress
        className="sticky top-0 z-10 h-2 rounded-none [&>div]:bg-blue-500"
        value={(answerCount / ANSWER_COUNT) * 100}
      />
      <h1 className="mb-4 py-4 text-center text-2xl font-bold">Lesson</h1>

      <div
        className={cn(
          'flex grow flex-col',
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
                    'min-w-20 space-y-2 rounded-t-2xl border p-4 whitespace-pre-wrap',
                    message.role === 'ai'
                      ? 'w-fit rounded-br-2xl'
                      : 'ml-auto w-fit rounded-bl-2xl',
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
                        size="icon"
                        variant="blue"
                        onClick={() => onTranslate(index, message.content)}
                        disabled={translates[index] !== undefined}
                      >
                        <MdGTranslate className="fill-white" />
                      </Button>
                      <Button
                        className="rounded-full"
                        size="icon"
                        onClick={() => handleReplyAudio(message.content)}
                      >
                        <FaPlay className="fill-background pl-1" />
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
              className="size-50 rounded-full bg-radial-[at_25%_25%] from-sky-200 to-sky-900 to-75% text-3xl font-bold"
            >
              スタート
            </Button>
          </div>
        ) : (
          <div className="animate-pulse">Waiting...</div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full">
        <div className="mx-auto flex max-w-xl justify-end p-4">
          <Button
            type="button"
            size="lg"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            variant={isRecording ? 'destructive' : 'default'}
            disabled={!isTestStarted || isProcessing}
            className={cn(
              'rounded-full px-4 py-2',
              isProcessing ? 'cursor-not-allowed opacity-50' : '',
            )}
          >
            {!isProcessing && isRecording && <FaPhoneSlash />}
            {!isProcessing && !isRecording && <FaPhone />}
            {isProcessing
              ? 'Processing...'
              : isRecording
                ? 'Stop Recording'
                : 'Start Recording'}
          </Button>
        </div>
      </div>
      <Dialog
        open={answerCount === ANSWER_COUNT}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleResetConversation();
          }
        }}
      >
        <DialogContent>
          <DialogTitle>採点</DialogTitle>
          <DialogHeader>
            <DialogDescription className="whitespace-pre-wrap">
              {result}
            </DialogDescription>
          </DialogHeader>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </div>
  );
}
