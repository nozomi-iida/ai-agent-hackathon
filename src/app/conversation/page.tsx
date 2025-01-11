'use client';

import { useState, useRef } from 'react';
import { startRecording } from './actions';

export default function ConversationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
        
        // Add user's speech to conversation
        setConversation(prev => [...prev, { role: 'user', content: response.text }]);
        
        // Add AI response to conversation
        setConversation(prev => [...prev, { role: 'ai', content: response.aiResponse }]);
        
        // Play AI response audio
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(
          Buffer.from(response.audioContent, 'base64').buffer
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Conversation</h1>
      
      <div className="mb-4">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
          className={`px-4 py-2 rounded ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      <div className="space-y-4">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto'
                : 'bg-gray-100 mr-auto'
            } max-w-[80%]`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 
