import type { Metadata } from 'next'
import './globals.css'
import ChatWidget from '@/components/ChatWidget'
import SiteNav from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'Home Cooks — Sivan Spices',
  description: 'We connect clients across the USA with cooks who deliver healthy home-cooked food or come cook it in your kitchen.',
  openGraph: {
    title: 'Home Cooks — Sivan Spices',
    description: 'We connect clients across the USA with cooks who deliver healthy home-cooked food or come cook it in your kitchen.',
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
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/sivanchefs-logo.png" alt="Sivan Chefs" className="h-12 sm:h-16 md:h-36 w-auto shrink-0" />
            <div className="flex flex-col min-w-0">
              <a href="/cooks" className="text-lg font-bold text-orange-600 leading-tight">Home Cooks</a>
              <span className="hidden sm:block text-xs text-gray-600 leading-tight">Delivered, picked up, or cooked in your own kitchen — meals, baking, pickles, preserves, sweets & snacks, and more, from cooks near you</span>
            </div>
          </div>
          <SiteNav />
        </header>
        <main>{children}</main>
        <ChatWidget />
        <footer className="mt-20 border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
          <p>
            A service by Sivan Chefs — delivered, picked up, or cooked in your own kitchen. Meals, baking, pickles, preserves, sweets & snacks, and more, from cooks near you.
          </p>
          <a href="/how-it-works" className="inline-block mt-2 text-orange-600 hover:underline">How It Works</a>
        </footer>
      </body>
    </html>
  )
}
