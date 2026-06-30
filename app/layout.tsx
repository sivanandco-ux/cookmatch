import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Home Cooks — SivanSpices',
  description: 'Hire a verified Indian home cook to cook fresh, healthy meals in your home.',
  openGraph: {
    title: 'Home Cooks — SivanSpices',
    description: 'Hire a verified Indian home cook to cook fresh, healthy meals in your home.',
    url: 'https://cookmatch-git-main-sivanspices.vercel.app/cooks',
    siteName: 'SivanSpices Home Cooks',
    images: [
      {
        url: 'https://cookmatch-git-main-sivanspices.vercel.app/sivanspices-logo.png',
        width: 1080,
        height: 1080,
        alt: 'SivanSpices Home Cooks',
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
              <img src="/sivanspices-logo.png" alt="SivanSpices" className="h-36 w-auto" />
            </a>
            <div className="flex flex-col">
              <a href="/cooks" className="text-lg font-bold text-orange-600 leading-tight">Home Cooks</a>
              <span className="text-xs text-gray-600 leading-tight">Hire a verified Indian home cook to cook fresh, healthy meals in your home</span>
            </div>
          </div>
          <nav className="flex gap-6 items-center text-sm font-medium">
            <a href="/cooks" className="text-gray-600 hover:text-orange-600">Find a Cook</a>
            <a href="/apply" className="text-orange-600 border border-orange-300 px-4 py-2 rounded-lg hover:bg-orange-50">
              Join as Cook
            </a>
            <a href="/how-it-works" className="text-gray-600 hover:text-orange-600">How It Works</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
          <p>
            A service by{' '}
            <a href="https://sivanspices.com" className="text-orange-600 hover:underline">
              SivanSpices
            </a>
            . We connect clients with verified Indian home cooks. We are a directory only and do not mediate engagements.
          </p>
        </footer>
      </body>
    </html>
  )
}
