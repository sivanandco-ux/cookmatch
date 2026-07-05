import type { Metadata } from 'next'
import './globals.css'
import ChatWidget from '@/components/ChatWidget'

export const metadata: Metadata = {
  title: 'Home Cooks — Sivan Spices',
  description: 'We connect clients with cooks who can visit your home to prepare healthy meals.',
  openGraph: {
    title: 'Home Cooks — Sivan Spices',
    description: 'We connect clients with cooks who can visit your home to prepare healthy meals.',
    url: 'https://cookmatch-flame.vercel.app/cooks',
    siteName: 'Sivan Spices Home Cooks',
    images: [
      {
        url: 'https://cookmatch-flame.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sivan Spices Home Cooks',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="https://sivanspices.com" target="_blank" rel="noopener noreferrer">
              <img src="/sivanspices-logo.png" alt="Sivan Spices" className="h-36 w-auto" />
            </a>
            <div className="flex flex-col">
              <a href="/cooks" className="text-lg font-bold text-orange-600 leading-tight">Home Cooks</a>
              <span className="text-xs text-gray-600 leading-tight">Cooks who visit your home to prepare healthy meals</span>
            </div>
          </div>
          <nav className="flex gap-6 items-center text-sm font-medium">
            <a href="/cooks" className="text-gray-600 hover:text-orange-600">Hire a Cook</a>
            <a href="/jobs" className="text-gray-600 hover:text-orange-600">Job Board</a>
            <div className="flex items-center border border-orange-300 rounded-lg overflow-hidden">
              <a href="/login" className="px-4 py-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600">Log In</a>
              <a href="/apply" className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700">Sign Up</a>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <ChatWidget />
        <footer className="mt-20 border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
          <p>
            A service by{' '}
            <a href="https://sivanspices.com" className="text-orange-600 hover:underline">
              Sivan Spices
            </a>
            . We connect clients with cooks who can visit your home to prepare healthy meals.
          </p>
          <a href="/how-it-works" className="inline-block mt-2 text-orange-600 hover:underline">How It Works</a>
        </footer>
      </body>
    </html>
  )
}
