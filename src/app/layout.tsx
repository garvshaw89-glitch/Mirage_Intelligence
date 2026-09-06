import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'MIRAGE — Multi-resolution Intelligent Risk & Adaptive Graph Engine',
  description:
    'AI-powered passive threat detection for unidirectional network traffic. ' +
    'SIH 2026 — Problem ID 26145 — NTRO.',
  keywords: ['cybersecurity', 'NTRO', 'threat detection', 'passive monitoring', 'network security'],
  authors: [{ name: 'MIRAGE Team' }],
  robots: { index: false, follow: false }, // Internal SOC tool — do not index
};

import { MirageProvider } from '@/components/providers/mirage-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#080c12" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta name="referrer" content="no-referrer" />
      </head>
      <body>
        <MirageProvider>
          {children}
        </MirageProvider>
      </body>
    </html>
  );
}
