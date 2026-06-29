import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CookMatch — Find Trusted Home Cooks',
  description: 'Discover verified Indian home cooks in Fremont and the Bay Area.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <a href="/cooks" className="text-xl font-bold text-orange-600">
            CookMatch
          </a>
          <nav className="flex gap-6 items-center text-sm font-medium">
            <a href="/cooks" className="text-gray-600 hover:text-orange-600">Find a Cook</a>
            <a href="/apply" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
              Join as Cook
            </a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mt-20 border-t border-gray-200 px-6 py-8 text-center text-sm text-gray-500">
          <p>
            CookMatch is a service by{' '}
            <a href="https://sivanspices.com" className="text-orange-600 hover:underline">
              SivanSpices
            </a>
            . We connect clients with verified home cooks. We are a directory only and do not mediate engagements.
          </p>
        </footer>
      </body>
    </html>
  )
}
