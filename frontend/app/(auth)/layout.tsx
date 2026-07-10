import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { Logo } from '@/components/layout/Logo';

// Auth pages should not be indexed.
export const metadata = buildMetadata({ noIndex: true });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <header className="container-bda flex items-center justify-between py-5">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={16} /> Back to site
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
