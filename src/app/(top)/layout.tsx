import { ModeToggle } from '@/components/mode-toggle';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center border-x border-zinc-700">
      <header className="flex w-full justify-end p-2">
        <ModeToggle />
      </header>
      {children}
    </div>
  );
}
