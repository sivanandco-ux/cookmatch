'use client'

import { useState } from 'react'

const PRIMARY_LINKS = [
  { href: '/cooks', label: 'Meet Our Cooks' },
  { href: '/jobs', label: 'Community Cravings' },
  { href: '/plan', label: 'Plan My Gig' },
]

const SECONDARY_LINKS = [
  { href: '/become-a-cook', label: 'Cook Guide' },
  { href: '/apply', label: 'Apply as a Cook' },
  { href: '/login', label: 'Cook Sign In' },
  { href: '/', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function SiteNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative flex items-center gap-2 sm:gap-4">
      <nav className="flex gap-3 sm:gap-6 items-center text-sm font-medium">
        {PRIMARY_LINKS.map(l => (
          <a key={l.href} href={l.href} className="text-paper/80 hover:text-brass-light">{l.label}</a>
        ))}
      </nav>

      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center w-10 h-10 text-paper/80 hover:text-brass-light"
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

      {open && (
        <nav className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col py-2 z-50 text-sm font-medium">
          {SECONDARY_LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-copper-50 hover:text-copper-600">
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
