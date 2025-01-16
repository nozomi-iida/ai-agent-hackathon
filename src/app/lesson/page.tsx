import { Button } from '@/components/ui/button';

export default function Page() {
  return (
    <div className="flex flex-grow flex-col items-center justify-center gap-4">
      <h1>Speaking Lesson</h1>
      <p>AIKOちゃんと喋ろう</p>
      <Button size="lg">Start</Button>
    </div>
  );
}
