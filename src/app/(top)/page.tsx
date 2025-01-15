import { Button } from '@mantine/core';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="">
      <h1>Top</h1>
      <p>英会話を頑張ろう</p>

      <div>
        <Button radius={999} component={Link} href="/lesson">
          Practice
        </Button>
        <Button radius={999} component={Link} href="/lesson/ielts">
          IELTS Mode
        </Button>
      </div>
    </div>
  );
}
