import { Button } from '@mantine/core';

export default function Page() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center gap-4">
      <h1>Speaking Lesson</h1>
      <p>AIKOちゃんと喋ろう</p>
      <Button size="lg" radius={999}>
        Start
      </Button>
    </div>
  );
}
