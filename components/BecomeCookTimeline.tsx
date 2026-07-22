'use client'

import { useState } from 'react'

type Step = { title: string; description: string; time: string }

type Track = {
  icon: string
  title: string
  subtitle: string
  totalTime: string
  color: 'blue' | 'orange' | 'green' | 'violet'
  steps: Step[]
}

// Colors picked from and validated with the dataviz skill's categorical
// palette (blue/aqua/orange ordering) — CVD separation ΔE 35.6, well clear
// of the safety floor. "Green" here maps to the aqua/emerald family, not a
// generic green, to preserve that separation from orange. "Violet" was
// added later for the supper club track and re-validated with
// scripts/validate_palette.js against all three existing colors — passes,
// same pre-existing WARN-tier (not fail) adjacency between orange/green
// as before, acceptable since every track already carries an icon + text
// label as secondary encoding, not color alone.
const COLORS = {
  blue: {
    dot: 'bg-blue-600',
    line: 'bg-blue-200',
    chip: 'text-blue-700 bg-blue-50 border-blue-200',
    header: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  orange: {
    dot: 'bg-copper-600',
    line: 'bg-copper-200',
    chip: 'text-copper-700 bg-copper-50 border-copper-200',
    header: 'bg-copper-50 border-copper-200 text-copper-700',
  },
  green: {
    dot: 'bg-emerald-600',
    line: 'bg-emerald-200',
    chip: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    header: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  violet: {
    dot: 'bg-violet-600',
    line: 'bg-violet-200',
    chip: 'text-violet-700 bg-violet-50 border-violet-200',
    header: 'bg-violet-50 border-violet-200 text-violet-700',
  },
} as const

const TRACKS: Track[] = [
  {
    icon: '🚗',
    title: 'Cook at Client Homes',
    subtitle: 'Travel to cook for clients — the simpler, faster path',
    totalTime: 'As little as 3–7 days',
    color: 'blue',
    steps: [
      { title: 'Pick a food handler course', description: 'Look for an ANAB-accredited (or your state’s required) food safety course.', time: 'Day 0' },
      { title: 'Complete the course & exam', description: 'Online, self-paced. Pass with a 70%+ score.', time: '~2–4 hrs' },
      { title: 'Get your card', description: 'California’s Food Handler Card is issued instantly online; other states may take a few days.', time: 'Instant–3 days' },
      { title: 'Sign up & verify your email', description: 'Create your SivanSpices cook profile.', time: '~1 day' },
      { title: 'Start taking bookings', description: 'You’re ready to cook in client homes.', time: '🎉' },
    ],
  },
  {
    icon: '🏠',
    title: 'Cook Hot Food at Home to Sell',
    subtitle: 'A licensed home-kitchen permit — shown for Alameda County, CA (MEHKO) as a verified example',
    totalTime: 'Roughly 4–8 weeks',
    color: 'orange',
    steps: [
      { title: 'Confirm your state allows it', description: 'Only a handful of states currently allow selling hot home-cooked meals — ask the chatbot below about yours.', time: 'Day 0' },
      { title: 'Complete a food safety manager course', description: 'More rigorous than a basic handler card — required for the permit holder.', time: '~1 week' },
      { title: 'Submit your permit application', description: 'In Alameda County: a $696 fee to the Department of Environmental Health.', time: '~1 day' },
      { title: 'Home kitchen inspection', description: 'The health department inspects your kitchen before approval.', time: '~2–4 weeks' },
      { title: 'Permit approved — start selling', description: 'Subject to meal and revenue caps (e.g. 30 meals/day, $100k/year in Alameda County).', time: '🎉' },
    ],
  },
  {
    icon: '🍪',
    title: 'Sell Shelf-Stable Snacks & Baked Goods',
    subtitle: 'Cottage Food — allowed in all 50 states + DC, no MEHKO permit needed',
    totalTime: 'Roughly 1–3 weeks',
    color: 'green',
    steps: [
      { title: 'Know what qualifies', description: 'Shelf-stable only: baked goods (no cream/custard fillings), candies & chocolates, jams/jellies/preserves, dried herbs & spices, roasted nuts, honey, granola, popcorn. Nothing needing refrigeration.', time: 'Day 0' },
      { title: 'Complete a food safety course', description: 'Most states require a short training before you register.', time: '~2–4 hrs' },
      { title: 'Register with your state/county', description: 'Many states only need registration; some add a permit + kitchen inspection for higher sales tiers.', time: '~1–2 weeks' },
      { title: 'Label your products', description: 'A "made in a home kitchen, not state-inspected" disclosure, plus ingredients and allergens.', time: '~1 day' },
      { title: 'Start selling', description: 'Direct to consumers — home pickup, farmers markets, or online orders, depending on your state.', time: '🎉' },
    ],
  },
  {
    icon: '🍽️',
    title: 'Host a Supper Club',
    subtitle: 'Ticketed dinners in your own home — the legal picture here is far less settled than cottage food or MEHKO',
    totalTime: 'No standard timeline — treat this as ongoing research, not a checklist',
    color: 'violet',
    steps: [
      { title: 'Understand there\'s no dedicated permit for this', description: 'Most states have no license category for a ticketed private dinner party. A few explicitly restrict it; most just haven\'t addressed it — that silence isn\'t the same as permission.', time: 'Day 0' },
      { title: 'Call your local health department directly', description: 'Ask specifically about "supper clubs," "pop-up dinners," or a temporary food facility permit for your situation, and get the answer in writing or note who you spoke to and when.', time: '~1 week' },
      { title: 'Decide private vs. public', description: 'A small, invite-only dinner for people you already know carries different risk than publicly selling tickets to strangers — the more it resembles a restaurant open to the public, the more scrutiny it invites.', time: 'Ongoing' },
      { title: 'Get liability coverage before you serve anyone', description: 'Homeowner\'s insurance typically doesn\'t cover a paying guest getting sick or hurt in your kitchen — look into a short-term event policy or general liability coverage, and consider a simple guest waiver.', time: 'Before first dinner' },
      { title: 'Start small and private, expand carefully', description: 'Host a few dinners for friends, family, and referrals before treating this as a repeatable public business — check back in with your health department before scaling beyond that.', time: '🎉' },
    ],
  },
]

export default function BecomeCookTimeline({ compact = false }: { compact?: boolean }) {
  // Compact mode (inside the narrow chat widget) starts with all three
  // tracks collapsed to just their headers — three full 5-step timelines
  // stacked in a ~360px-wide scroll box was unreadable. Only one track
  // open at a time keeps it scannable. The full-page version (compact
  // false) has room to show everything at once, so it's unaffected.
  const [openTrack, setOpenTrack] = useState<string | null>(null)

  return (
    <div className={compact ? 'flex flex-col gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-8'}>
      {TRACKS.map(track => {
        const c = COLORS[track.color]
        const isOpen = !compact || openTrack === track.title
        return (
          <div key={track.title}>
            <div
              className={`rounded-xl border px-4 py-3 ${isOpen ? 'mb-4' : ''} ${c.header} ${compact ? 'cursor-pointer' : ''}`}
              onClick={compact ? () => setOpenTrack(isOpen ? null : track.title) : undefined}
              role={compact ? 'button' : undefined}
              aria-expanded={compact ? isOpen : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`}>{track.icon} {track.title}</p>
                  <p className="text-xs mt-0.5 opacity-80">{track.subtitle}</p>
                  <p className="text-xs font-medium mt-1.5">⏱ Total: {track.totalTime}</p>
                </div>
                {compact && (
                  <span className={`text-xs shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                )}
              </div>
            </div>
            {isOpen && (
              <div className="flex flex-col">
                {track.steps.map((step, i) => {
                  const isLast = i === track.steps.length - 1
                  return (
                    <div key={step.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${c.dot}`}>
                          {i + 1}
                        </div>
                        {!isLast && <div className={`w-px flex-1 my-1 ${c.line}`} />}
                      </div>
                      <div className={isLast ? 'pb-1' : 'pb-5'}>
                        <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5 leading-snug">{step.description}</p>
                        <span className={`inline-block mt-1.5 text-xs font-medium rounded-full px-2 py-0.5 border ${c.chip}`}>
                          {step.time}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
