import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex flex-grow flex-col items-center justify-center gap-4">
      <h1>Top</h1>
      <p>英会話を頑張ろう</p>

      <Button size="lg" asChild>
        <Link href="/lesson">Practice</Link>
      </Button>
      <Button size="lg" asChild>
        <Link href="/lesson/ielts">IELTS Mode</Link>
      </Button>
    </div>
  );
}
