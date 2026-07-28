'use client'

import { useState } from 'react'

const LINKS = [
  { href: '/plan', label: 'Plan My Gig' },
  { href: '/become-a-cook', label: 'Cook Guide' },
  { href: '/cooks', label: 'Browse Cooks' },
  { href: '/apply', label: 'Apply as a Cook' },
  { href: '/jobs', label: 'Post a Job' },
  { href: '/', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      {/* Desktop nav */}
      <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
        {LINKS.map(l => (
          <a key={l.href} href={l.href} className="text-paper/80 hover:text-brass-light">{l.label}</a>
        ))}
      </nav>

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="md:hidden flex items-center justify-center w-10 h-10 text-paper/80 hover:text-brass-light"
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
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-copper-50 hover:text-copper-600">
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
