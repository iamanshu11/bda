import type { Metadata, Viewport } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo';

// Body + heading fonts wired to CSS variables used in tailwind.config.ts
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['600', '700', '800'],
  display: 'swap',
});

// Root/default metadata. Pages override via their own buildMetadata() call.
export const metadata: Metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#061128' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Prevent theme flash before hydration.
const themeScript = `(function(){try{var t=localStorage.getItem('bda-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
