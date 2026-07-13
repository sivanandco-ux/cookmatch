'use client'

import { useState } from 'react'

const LINKS = [
  { href: '/cooks', label: 'Hire a Cook' },
  { href: '/jobs', label: 'Job Board' },
  { href: '/become-a-cook', label: 'Become a Cook' },
]

export default function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      {/* Desktop nav */}
      <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
        {LINKS.map(l => (
          <a key={l.href} href={l.href} className="text-gray-600 hover:text-orange-600">{l.label}</a>
        ))}
        <div className="flex items-center border border-orange-300 rounded-lg overflow-hidden">
          <a href="/login" className="px-4 py-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600">Cook Log In</a>
          <a href="/apply" className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700">Cook Sign Up</a>
        </div>
      </nav>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:text-orange-600"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={2}>
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col py-2 z-50 text-sm font-medium">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-orange-50 hover:text-orange-600">
              {l.label}
            </a>
          ))}
          <div className="border-t border-gray-100 my-1" />
          <a href="/login" onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-orange-50 hover:text-orange-600">
            Cook Log In
          </a>
          <a href="/apply" onClick={() => setOpen(false)} className="mx-4 mt-1 mb-1 px-4 py-2 text-center rounded-lg bg-orange-600 text-white hover:bg-orange-700">
            Cook Sign Up
          </a>
        </nav>
      )}
    </div>
  )
}
