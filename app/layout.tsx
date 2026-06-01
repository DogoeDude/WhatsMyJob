import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-app',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-app',
});

export const metadata: Metadata = {
  title: 'WhatsMyJob',
  description: 'Search remote and on-site jobs pulled from public job board APIs.',
  icons: {
    icon: [{ url: '/job.svg', type: 'image/svg+xml' }],
    apple: '/job.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
