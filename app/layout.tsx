import type { Metadata } from 'next'
import { Domine, Work_Sans } from 'next/font/google'
import './globals.css'
import ChatWidget from '@/components/ChatWidget'
import SiteNav from '@/components/SiteNav'

const domine = Domine({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-display' })
const workSans = Work_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Home Cooks — Sivan Cooks',
  description: 'Sivan Cooks connects clients across the USA with home cooks near you.',
  openGraph: {
    title: 'Home Cooks — Sivan Cooks',
    description: 'Sivan Cooks connects clients across the USA with home cooks near you.',
    url: 'https://cookmatch-flame.vercel.app/cooks',
    siteName: 'Sivan Cooks',
    images: [
      {
        url: 'https://cookmatch-flame.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sivan Cooks — Your Directory for Local Culinary Artisans',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${domine.variable} ${workSans.variable}`}>
      <body className="min-h-screen bg-paper text-gray-900">
        <header className="sticky top-0 z-20 bg-leaf-700/96 backdrop-blur-sm border-b border-brass-light/25 px-2.5 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/cooks" className="shrink-0">
              <img src="/sivancooks-logo.png" alt="Sivan Cooks" className="h-12 sm:h-[58px] md:h-[84px] w-auto" />
            </a>
            <span className="hidden sm:block text-base sm:text-lg font-semibold text-paper leading-tight min-w-0">Your Directory for Local Culinary Artisans</span>
          </div>
          <SiteNav />
        </header>
        <main>{children}</main>
        <ChatWidget />
        <footer className="mt-20 border-t border-copper-200 px-6 py-8 text-center text-sm text-gray-500">
          <p>
            A service by Sivan Cooks — delivered, picked up, or cooked in your own kitchen. Meals, baking, pickles, preserves, sweets & snacks, and more, from cooks near you.
          </p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <a href="/how-it-works" className="text-copper-600 hover:underline">How It Works</a>
            <span className="text-gray-300">·</span>
            <a href="/terms" className="text-copper-600 hover:underline">Terms of Service</a>
          </div>
        </footer>
      </body>
    </html>
  )
}
