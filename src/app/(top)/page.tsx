import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex grow flex-col items-center justify-center gap-y-8">
      <div className="flex flex-col items-center gap-y-4">
        <h1 className="text-3xl font-bold">むちゃぶり英会話</h1>
        <p className="text-xl font-bold text-sky-700">- MUCHABURI -</p>
      </div>

      <div className="size-50 rounded-full bg-radial-[at_25%_25%] from-sky-200 to-sky-900 to-75%"></div>

      <div className="w-80 space-y-3">
        <Button
          className="w-full rounded-full bg-sky-200 text-black hover:bg-sky-300"
          size="lg"
          asChild
        >
          <Link href="/lesson">通常 MODE</Link>
        </Button>
        <Button
          className="w-full rounded-full bg-sky-500 hover:bg-sky-600"
          size="lg"
          asChild
        >
          <Link href="/lesson">むちゃぶり MODE</Link>
        </Button>
        <Button
          className="w-full rounded-full bg-sky-700 text-white hover:bg-sky-800"
          size="lg"
          asChild
        >
          <Link href="/lesson/ielts">IELTS MODE</Link>
        </Button>
      </div>
    </div>
  );
}
