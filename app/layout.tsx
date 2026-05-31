import type { Metadata } from 'next'

import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'



const geistSans = Geist({

  subsets: ['latin'],

  variable: '--font-geist-sans',

})



const geistMono = Geist_Mono({

  subsets: ['latin'],

  variable: '--font-geist-mono',

})



export const metadata: Metadata = {

  title: 'WhatsMyJob',

  description: 'Discover job listings aggregated from top job boards and company career pages.',

  icons: {

    icon: [{ url: '/job.svg', type: 'image/svg+xml' }],

    apple: '/job.svg',

  },

}



export default function RootLayout({

  children,

}: Readonly<{

  children: React.ReactNode

}>) {

  return (

    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>

      <body className="min-h-screen font-sans bg-background text-foreground antialiased">

        {children}

      </body>

    </html>

  )

}

