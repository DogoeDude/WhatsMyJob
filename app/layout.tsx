import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { getCachedSession } from '@/lib/auth-session'
import { AppLoadingProvider } from '@/components/app-loading-provider'
import { SessionProvider } from '@/lib/session-provider'
import './globals.css'

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
    <html lang="en" className="bg-background">
      <body className="win-canvas font-sans antialiased">
        <SessionProvider initialSession={session ?? null}>
          <AppLoadingProvider>{children}</AppLoadingProvider>
        </SessionProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
