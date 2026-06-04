import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { getCachedSession } from '@/lib/auth-session'
import { AppLoadingProvider } from '@/components/app-loading-provider'
import { SessionProvider } from '@/lib/session-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'WhatsMyJob',
  description: 'Search remote and on-site jobs from public job board APIs.',
  icons: {
    icon: [{ url: '/job.svg', type: 'image/svg+xml' }],
    apple: '/job.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCachedSession();

  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <SessionProvider initialSession={session ?? null}>
          <AppLoadingProvider>{children}</AppLoadingProvider>
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
