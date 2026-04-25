import * as React from 'react';
import type { Metadata } from 'next';
import { Caveat } from 'next/font/google';

import '@workspace/ui/globals.css';
import { Toaster } from '@workspace/ui/components/sonner';
import { ThemeProvider } from '@workspace/ui/hooks/use-theme';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sketch',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TenderEval — AI-powered tender evaluation',
  description:
    'Consistent, auditable tender evaluation for procurement officers. AI-assisted criteria extraction, hybrid retrieval, and officer review workflows.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
};

export default function RootLayout(
  props: React.PropsWithChildren
): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${caveat.variable} min-h-dvh bg-background text-foreground antialiased`}>
        {/* Hidden SVG filter for sketch border effect on landing page */}
        <svg className="absolute size-0 overflow-hidden" aria-hidden="true" focusable="false">
          <defs>
            <filter id="sketch-filter" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {props.children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
