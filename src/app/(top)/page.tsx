import { Button } from '@mantine/core';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center gap-4">
      <h1>Top</h1>
      <p>英会話を頑張ろう</p>
      <Button size="lg" radius={999} component={Link} href="/lesson">
        Practice
      </Button>
      <Button size="lg" radius={999} component={Link} href="/lesson/ielts">
        IELTS Mode
      </Button>
    </div>
  );
}
