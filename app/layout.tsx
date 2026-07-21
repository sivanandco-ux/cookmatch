import type { Metadata } from 'next'
import { Domine, Work_Sans } from 'next/font/google'
import './globals.css'
import ChatWidget from '@/components/ChatWidget'
import SiteNav from '@/components/SiteNav'

const domine = Domine({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-display' })
const workSans = Work_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Sivan Cooks — A Planning Tool for Home Cooks',
  description: 'Sivan Cooks helps you decide whether turning your cooking into a side income is worth it — legal paths, real costs, and a break-even estimate before you spend on a permit.',
  openGraph: {
    title: 'Sivan Cooks — A Planning Tool for Home Cooks',
    description: 'Sivan Cooks helps you decide whether turning your cooking into a side income is worth it — legal paths, real costs, and a break-even estimate before you spend on a permit.',
    url: 'https://cookmatch-flame.vercel.app/plan',
    siteName: 'Sivan Cooks',
    images: [
      {
        url: 'https://cookmatch-flame.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sivan Cooks — A Planning Tool for Home Cooks',
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
            <a href="/" className="shrink-0">
              <img src="/sivancooks-logo.png" alt="Sivan Cooks" className="h-12 sm:h-[58px] md:h-[84px] w-auto" />
            </a>
            <span className="hidden sm:block text-base sm:text-lg font-semibold text-paper leading-tight min-w-0">A Planning Tool for Home Cooks</span>
          </div>
          <SiteNav />
        </header>
        <main>{children}</main>
        <ChatWidget />
        <footer className="mt-20 border-t border-copper-200 px-6 py-8 text-center text-sm text-gray-500">
          <p>
            A planning tool by Sivan Cooks — helping home cooks decide if turning their cooking into a side income is worth pursuing.
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
