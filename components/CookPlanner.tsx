'use client'

import { useState, ReactNode } from 'react'
import { US_STATES } from '@/lib/usStates'
import {
  FOOD_TYPE_OPTIONS,
  HOME_MEAL_LAW_STATES,
  CA_MEHKO,
  CA_COTTAGE_FOOD,
  CA_FOOD_HANDLER_CARD,
  CA_FOOD_SAFETY_CLASS_FEE,
  type FoodType,
  type Arrangement,
} from '@/lib/foodLawReference'

type Period = 'week' | 'month' | 'year'

const STEP_LABELS = ['Interest', 'Income Goal', 'What & How', 'Profit & Volume', 'Setup Costs', 'Where to Sell', 'Decision']

const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

function Card({ children }: { children: ReactNode }) {
  return <div className="bg-panel rounded-sm border-l-4 border-copper-600 p-6">{children}</div>
}

function ChoiceButton({ active, onClick, title, subtitle }: { active: boolean; onClick: () => void; title: string; subtitle?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left border rounded-xl px-4 py-3 transition-colors w-full ${active ? 'border-copper-600 bg-copper-50' : 'border-gray-200 hover:border-copper-300'}`}
    >
      <p className="font-semibold text-gray-900 text-sm">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </button>
  )
}

function NavButtons({ onBack, onNext, nextDisabled, nextLabel }: { onBack?: () => void; onNext?: () => void; nextDisabled?: boolean; nextLabel?: string }) {
  return (
    <div className="flex gap-3 mt-6">
      {onBack && (
        <button onClick={onBack} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-copper-400 hover:text-copper-600 transition-colors">
          ← Back
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="flex-1 bg-copper-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-copper-700 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {nextLabel ?? 'Continue →'}
        </button>
      )}
    </div>
  )
}

interface SetupItem { label: string; note: string }

const OPERATING_COST_REMINDERS: SetupItem[] = [
  { label: 'Packaging supplies', note: 'Jars, boxes, bags, and labels — your per-unit cost (from Step 3) covers what goes into each sale, but budget for an initial bulk stock too, since suppliers usually sell in quantities bigger than your first batch.' },
  { label: 'Transportation', note: 'Gas, vehicle wear, or delivery time/mileage if you\'re dropping off orders or driving to a farmers market — easy to forget since it doesn\'t show up on a receipt the way ingredients do.' },
  { label: 'Your own labor', note: 'Time is a real cost even on a side gig. Check the effective hourly rate on the Profit & Volume step — if it\'s well below what your time is worth elsewhere, that\'s worth weighing before you invest in a permit.' },
]

function getSetupPlan(foodType: FoodType, arrangement: Arrangement, state: string, annualRevenue: number | null): { items: SetupItem[]; knownTotal: number | null; unknownCosts: boolean; blocked: boolean } {
  const isCA = state === 'California'
  const shelfStable = FOOD_TYPE_OPTIONS.find(f => f.value === foodType)?.shelfStable ?? true

  if (arrangement === 'travel') {
    return {
      items: [
        {
          label: 'Food handler card',
          note: isCA
            ? `An ANAB-accredited online course, roughly ${money(CA_FOOD_HANDLER_CARD.minCost)}–${money(CA_FOOD_HANDLER_CARD.maxCost)}, a few hours, valid 3 years.`
            : `Every state requires some form of food handler certification — ServSafe Food Handler is a common option. Confirm the exact card and cost your state/county requires with your local health department.`,
        },
        { label: 'Home-kitchen permit', note: 'Not needed for this arrangement — you cook in the client\'s own kitchen, not from your home.' },
      ],
      knownTotal: isCA ? CA_FOOD_HANDLER_CARD.maxCost : null,
      unknownCosts: !isCA,
      blocked: false,
    }
  }

  // arrangement === 'home'
  if (!shelfStable) {
    if (!state) {
      return { items: [], knownTotal: null, unknownCosts: true, blocked: false }
    }
    if (!HOME_MEAL_LAW_STATES.includes(state)) {
      return {
        items: [{
          label: 'No current legal path',
          note: `Selling ${foodType === 'meals' ? 'hot meals' : 'this'} from your own home has no clear legal path in ${state} right now. This isn't a dead end — traveling to cook in a client's own kitchen is legal in every state with just a food handler card, and is worth reconsidering as your arrangement instead.`,
        }],
        knownTotal: null,
        unknownCosts: false,
        blocked: true,
      }
    }
    if (isCA) {
      return {
        items: [
          { label: 'Food safety class', note: `Alameda County's own required course for CFO/MEHKO registration: ${money(CA_FOOD_SAFETY_CLASS_FEE)} (per the county's official fee schedule).` },
          { label: 'MEHKO permit fee', note: `${money(CA_MEHKO.permitFee)} county fee in Alameda County, plus a health inspection before approval.` },
          { label: 'Home kitchen inspection', note: 'Roughly 2–4 weeks from application to approval.' },
        ],
        knownTotal: CA_FOOD_SAFETY_CLASS_FEE + CA_MEHKO.permitFee,
        unknownCosts: false,
        blocked: false,
      }
    }
    return {
      items: [
        { label: 'Food safety manager course', note: 'More rigorous than a basic handler card — required for the permit holder (cost varies by provider).' },
        { label: 'Home-kitchen permit fee', note: `${state} allows this in principle, but we don't have a verified fee for it — check with your state's Department of Agriculture or Health.` },
        { label: 'Home kitchen inspection', note: 'Most states with this kind of permit require an inspection before approval — timeline varies.' },
      ],
      knownTotal: null,
      unknownCosts: true,
      blocked: false,
    }
  }

  // shelf-stable cottage food
  if (isCA) {
    const needsClassB = annualRevenue != null && annualRevenue > CA_COTTAGE_FOOD.classA.annualRevenueCap
    const tierFee = needsClassB ? CA_COTTAGE_FOOD.classB.fee : CA_COTTAGE_FOOD.classA.fee
    return {
      items: [
        { label: 'Food safety class', note: `Alameda County's own required course for CFO registration: ${money(CA_FOOD_SAFETY_CLASS_FEE)} (per the county's official fee schedule).` },
        {
          label: needsClassB ? 'Class B CFO permit (indirect sales)' : 'Class A CFO registration (direct sales)',
          note: needsClassB
            ? `${money(CA_COTTAGE_FOOD.classB.fee)} permit fee, plus a kitchen inspection — needed since your target from Step 3 is above Class A's ~${money(CA_COTTAGE_FOOD.classA.annualRevenueCap)}/yr cap. Covers sales up to ~${money(CA_COTTAGE_FOOD.classB.annualRevenueCap)}/yr.`
            : `${money(CA_COTTAGE_FOOD.classA.fee)} registration fee, no inspection required — covers direct sales up to ~${money(CA_COTTAGE_FOOD.classA.annualRevenueCap)}/yr.`,
        },
        { label: 'Labeling', note: 'A "made in a home kitchen, not state-inspected" disclosure, plus ingredients and allergens on every label.' },
      ],
      knownTotal: CA_FOOD_SAFETY_CLASS_FEE + tierFee,
      unknownCosts: false,
      blocked: false,
    }
  }
  return {
    items: [
      { label: 'Food safety course', note: 'Most states require a short training before you can register (cost varies by provider).' },
      {
        label: 'Registration or permit',
        note: `Most states only require registration at first, sometimes adding a permit + inspection at higher sales tiers — check your state's cottage food agency for the exact fee and cap.`,
      },
      { label: 'Labeling', note: 'A "made in a home kitchen, not state-inspected" disclosure, plus ingredients and allergens on every label.' },
    ],
    knownTotal: null,
    unknownCosts: true,
    blocked: false,
  }
}

export default function CookPlanner() {
  const [step, setStep] = useState(0)
  const [interested, setInterested] = useState<boolean | null>(null)
  const [goalAmount, setGoalAmount] = useState('')
  const [goalPeriod, setGoalPeriod] = useState<Period>('month')
  const [foodType, setFoodType] = useState<FoodType | null>(null)
  const [arrangement, setArrangement] = useState<Arrangement | null>(null)
  const [state, setState] = useState('')
  const [price, setPrice] = useState('')
  const [ingredientCost, setIngredientCost] = useState('')
  const [packagingCost, setPackagingCost] = useState('')
  const [minutesPerUnit, setMinutesPerUnit] = useState('')

  const monthlyGoal = goalAmount
    ? (goalPeriod === 'week' ? (Number(goalAmount) * 52) / 12 : goalPeriod === 'year' ? Number(goalAmount) / 12 : Number(goalAmount))
    : 0
  const totalCostPerUnit = (Number(ingredientCost) || 0) + (Number(packagingCost) || 0)
  const profitPerUnit = (Number(price) || 0) - totalCostPerUnit
  const unitsNeededPerMonth = profitPerUnit > 0 && monthlyGoal > 0 ? Math.ceil(monthlyGoal / profitPerUnit) : null
  const monthlyRevenue = unitsNeededPerMonth ? unitsNeededPerMonth * Number(price) : null
  const annualRevenue = monthlyRevenue ? monthlyRevenue * 12 : null
  const effectiveHourlyWage = profitPerUnit > 0 && Number(minutesPerUnit) > 0 ? profitPerUnit / (Number(minutesPerUnit) / 60) : null

  const setupPlan = foodType && arrangement ? getSetupPlan(foodType, arrangement, state, annualRevenue) : null
  const monthsToBreakEven = setupPlan?.knownTotal && monthlyGoal > 0 ? setupPlan.knownTotal / monthlyGoal : null

  const foodTypeOption = FOOD_TYPE_OPTIONS.find(f => f.value === foodType)
  const isCA = state === 'California'

  function jumpTo(i: number) {
    if (i < step) setStep(i)
  }

  // ── Step 6 decision logic ──────────────────────────────────────────────
  let verdict: { tone: 'good' | 'warn'; message: string } | null = null
  if (foodType && arrangement && unitsNeededPerMonth) {
    if (setupPlan?.blocked) {
      verdict = { tone: 'warn', message: setupPlan.items[0].note }
    } else if (arrangement === 'home' && !foodTypeOption?.shelfStable && isCA) {
      if (unitsNeededPerMonth > CA_MEHKO.mealsPerMonthCap) {
        verdict = { tone: 'warn', message: `Your target of about ${unitsNeededPerMonth} meals/month is above MEHKO's cap of ${CA_MEHKO.mealsPerDayCap}/day (~${CA_MEHKO.mealsPerMonthCap}/month) in Alameda County. At this volume, a commercial kitchen, cloud kitchen, or food truck would let you keep scaling — all legitimate paths, just beyond what SivanCooks (a home-cook platform) covers.` }
      } else if (annualRevenue && annualRevenue > CA_MEHKO.annualRevenueCap) {
        verdict = { tone: 'warn', message: `Your target works out to about ${money(annualRevenue)}/year, above MEHKO's ${money(CA_MEHKO.annualRevenueCap)}/year revenue cap in Alameda County. Consider whether staying under that cap works for you, or look into a commercial kitchen, cloud kitchen, or food truck to keep scaling beyond it.` }
      } else {
        verdict = { tone: 'good', message: `Your target fits comfortably within MEHKO's limits (${CA_MEHKO.mealsPerDayCap} meals/day, ${money(CA_MEHKO.annualRevenueCap)}/year) in Alameda County. A home-kitchen permit should support this goal.` }
      }
    } else if (arrangement === 'home' && foodTypeOption?.shelfStable && isCA) {
      if (annualRevenue && annualRevenue > CA_COTTAGE_FOOD.classB.annualRevenueCap) {
        verdict = { tone: 'warn', message: `Your target works out to about ${money(annualRevenue)}/year, above even Class B cottage food's ~${money(CA_COTTAGE_FOOD.classB.annualRevenueCap)}/year cap. At this volume, a commercial or cloud kitchen would let you keep scaling — legitimate paths beyond what SivanCooks covers.` }
      } else if (annualRevenue && annualRevenue > CA_COTTAGE_FOOD.classA.annualRevenueCap) {
        verdict = { tone: 'good', message: `Your target works out to about ${money(annualRevenue)}/year, within Class B cottage food's ~${money(CA_COTTAGE_FOOD.classB.annualRevenueCap)}/year cap, though above Class A's ~${money(CA_COTTAGE_FOOD.classA.annualRevenueCap)}/year — you'd need the permit + inspection tier, not registration-only.` }
      } else {
        verdict = { tone: 'good', message: `Your target works out to about ${money(annualRevenue ?? 0)}/year, comfortably within Class A cottage food's ~${money(CA_COTTAGE_FOOD.classA.annualRevenueCap)}/year cap — registration alone should be enough to start.` }
      }
    } else if (arrangement === 'travel') {
      verdict = { tone: 'good', message: `Traveling to cook in a client's kitchen has no revenue cap — it's treated like a personal-chef arrangement, not a home food business. Your target of about ${unitsNeededPerMonth} sessions/month is achievable from a legal standpoint; whether it's realistic depends on demand in your area.` }
    } else {
      verdict = { tone: 'good', message: `We don't have a verified revenue cap for ${state || 'your state'} to check your target against — ask the "Cook & Sell Food" chat for your state's specific agency, or check with them directly once you know your numbers.` }
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Is a Cooking Gig Worth It?</h1>
        <p className="text-sm text-gray-500 mt-1">Walk through your numbers before you invest in a permit — no signup required.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Main step content */}
        <div className="flex-1 w-full min-w-0">
          <Card>
            <p className="text-xs font-semibold text-copper-600 uppercase tracking-wide mb-3">
              Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
            </p>

            {step === 0 && (
              <div>
                <p className="text-gray-800 font-medium mb-4">Are you thinking about cooking or baking as a side income?</p>
                <div className="grid grid-cols-2 gap-3">
                  <ChoiceButton active={interested === true} onClick={() => setInterested(true)} title="Yes, let's see" />
                  <ChoiceButton active={interested === false} onClick={() => setInterested(false)} title="Just browsing" />
                </div>
                {interested === false && (
                  <p className="text-sm text-gray-500 mt-4">
                    No problem — take a look at <a href="/cooks" className="text-copper-600 underline">cooks near you</a> or come back any time.
                  </p>
                )}
                <NavButtons onNext={() => setStep(1)} nextDisabled={interested !== true} />
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-gray-800 font-medium mb-4">How much would you like to earn from this?</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={goalAmount}
                    onChange={e => setGoalAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <select value={goalPeriod} onChange={e => setGoalPeriod(e.target.value as Period)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="week">per week</option>
                    <option value="month">per month</option>
                    <option value="year">per year</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-2">Think of this as a target to grow into over a few months, not a week-one expectation.</p>
                <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!goalAmount || Number(goalAmount) <= 0} />
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-gray-800 font-medium mb-3">What would you make?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FOOD_TYPE_OPTIONS.map(f => (
                      <ChoiceButton key={f.value} active={foodType === f.value} onClick={() => setFoodType(f.value)} title={f.label} subtitle={f.description} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-800 font-medium mb-3">How would you cook and serve?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <ChoiceButton active={arrangement === 'travel'} onClick={() => setArrangement('travel')} title="Travel to cook at a client's home" subtitle="Cook in their kitchen — a personal-chef style arrangement" />
                    <ChoiceButton active={arrangement === 'home'} onClick={() => setArrangement('home')} title="Cook at home, sell to the community" subtitle="Prepare it in your own kitchen and sell/deliver it" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-800 font-medium mb-2">Which state are you in?</p>
                  <select value={state} onChange={e => setState(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Select a state</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={!foodType || !arrangement || !state} />
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 text-sm text-blue-900">
                  <p className="font-semibold mb-1">Revenue isn't profit</p>
                  <p className="leading-relaxed">
                    <strong>Revenue</strong> is what you collect from sales. <strong>Profit</strong> is what's left after ingredients, packaging, and fees —
                    that's the part that's actually yours. Most new food businesses spend their first few months of revenue just paying back what it
                    cost to get started, before any of it counts as real profit. Both numbers matter, so we'll keep them separate below.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Price per {foodTypeOption?.shelfStable ? 'item' : 'meal/session'} ($)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 12" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Ingredient cost per unit ($)</label>
                    <input type="number" value={ingredientCost} onChange={e => setIngredientCost(e.target.value)} placeholder="e.g. 3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Packaging cost per unit ($)</label>
                    <input type="number" value={packagingCost} onChange={e => setPackagingCost(e.target.value)} placeholder="e.g. 1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Time to make one unit (minutes)</label>
                    <input type="number" value={minutesPerUnit} onChange={e => setMinutesPerUnit(e.target.value)} placeholder="e.g. 20" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Transportation (gas, delivery time) and any equipment aren't per-unit costs the same way — those show up on the next step instead.
                </p>

                {profitPerUnit > 0 && monthlyGoal > 0 && (
                  <div className="mt-5 bg-copper-50 border border-copper-200 rounded-lg px-4 py-3 text-sm text-gray-800">
                    <p>Profit per unit: <strong>{money(profitPerUnit)}</strong> (price minus ingredients and packaging)</p>
                    <p className="mt-1">To reach {money(monthlyGoal)}/month, you'd need to sell about <strong>{unitsNeededPerMonth} {foodTypeOption?.shelfStable ? 'items' : 'meals/sessions'}/month</strong> (roughly {money(monthlyRevenue ?? 0)}/month in revenue).</p>
                    {effectiveHourlyWage != null && (
                      <p className="mt-1">
                        At {minutesPerUnit} minutes per unit, that profit works out to about <strong>{money(effectiveHourlyWage)}/hour</strong> for your own time — worth comparing against what your time is worth elsewhere before deciding this is worth the investment.
                      </p>
                    )}
                  </div>
                )}
                {price && ingredientCost && packagingCost && profitPerUnit <= 0 && (
                  <p className="mt-4 text-sm text-red-600">Your ingredient + packaging cost is at or above your price — there's no profit margin to work with yet. Try adjusting one of the numbers.</p>
                )}

                <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} nextDisabled={!price || !ingredientCost || profitPerUnit <= 0} />
              </div>
            )}

            {step === 4 && setupPlan && (
              <div>
                <p className="text-gray-800 font-medium mb-4">What it costs to legally get started</p>
                <div className="flex flex-col gap-3">
                  {setupPlan.items.map(item => (
                    <div key={item.label} className={`border rounded-lg px-4 py-3 ${setupPlan.blocked ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                      <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-snug">{item.note}</p>
                    </div>
                  ))}
                </div>
                {setupPlan.knownTotal != null && (
                  <div className="mt-4 bg-copper-50 border border-copper-200 rounded-lg px-4 py-3 text-sm text-gray-800">
                    <p>Known upfront cost: <strong>{money(setupPlan.knownTotal)}</strong>{setupPlan.unknownCosts ? ' (other costs like your safety course vary by provider and aren\'t included)' : ''}</p>
                    {monthsToBreakEven != null && (
                      <p className="mt-1">
                        At your target profit rate, that pays for itself in about{' '}
                        <strong>{monthsToBreakEven < 1 ? 'less than a month' : `${Math.ceil(monthsToBreakEven)} month${Math.ceil(monthsToBreakEven) > 1 ? 's' : ''}`}</strong> — assuming you're already hitting your target volume, which usually takes some ramp-up time in practice.
                      </p>
                    )}
                  </div>
                )}
                {setupPlan.knownTotal == null && !setupPlan.blocked && (
                  <p className="mt-4 text-xs text-gray-500">
                    We don't have a verified fee to total up for {state || 'your state'} — once you know your registration/permit fee, months to break even = that fee ÷ your monthly profit target.
                  </p>
                )}

                {!setupPlan.blocked && (
                  <div className="mt-6">
                    <p className="text-gray-800 font-medium mb-1">Other costs to plan for</p>
                    <p className="text-xs text-gray-500 mb-3">These don't have a fixed nationwide number the way registration fees do — they depend on your setup — but they're real costs, not legal/regulatory ones like the items above.</p>
                    <div className="flex flex-col gap-3">
                      {OPERATING_COST_REMINDERS.map(item => (
                        <div key={item.label} className="border border-gray-200 rounded-lg px-4 py-3">
                          <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                          <p className="text-xs text-gray-600 mt-0.5 leading-snug">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <NavButtons onBack={() => setStep(3)} onNext={() => setStep(5)} />
              </div>
            )}

            {step === 5 && (
              <div>
                <p className="text-gray-800 font-medium mb-4">Where you could sell this</p>
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                  {arrangement === 'travel' ? (
                    <>
                      <p>• SivanCooks bookings — clients post a job, you get matched directly</p>
                      <p>• Word of mouth within your community</p>
                      <p>• Facebook Marketplace or local community/buy-sell groups</p>
                    </>
                  ) : (
                    <>
                      <p>• SivanCooks item/session listings</p>
                      <p>• Local farmers markets (check their vendor rules)</p>
                      <p>• Word of mouth and local community groups</p>
                      <p>• Facebook Marketplace or local community/buy-sell groups</p>
                    </>
                  )}
                </div>
                <NavButtons onBack={() => setStep(4)} onNext={() => setStep(6)} />
              </div>
            )}

            {step === 6 && (
              <div>
                {verdict && (
                  <div className={`rounded-lg px-4 py-3 border text-sm mb-5 ${verdict.tone === 'good' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <p className="font-semibold mb-1">{verdict.tone === 'good' ? 'This looks workable' : 'Worth reconsidering the setup'}</p>
                    <p className="leading-relaxed">{verdict.message}</p>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg px-4 py-3">
                  <p className="font-semibold text-gray-900 text-sm mb-1">Before you get licensed: test the interest first</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    A permit or registration is a real investment — it's worth checking people will actually pay before you make it. A few honest, low-cost ways to check:
                  </p>
                  <ul className="text-sm text-gray-600 leading-relaxed list-disc pl-5 flex flex-col gap-1">
                    <li>Ask your likely customers directly — friends, family, neighbors, community or religious groups, coworkers — whether they'd pay your planned price. A show of hands isn't a sale, but it's a start.</li>
                    <li>Offer a small batch at a community gathering, potluck, or event you're already attending, and see how people actually respond.</li>
                    <li>Post in local community groups (neighborhood apps, WhatsApp groups, local social media) describing what you'd offer and gauge real interest, not just compliments.</li>
                    <li>Pre-sell a small batch at your real planned price, not a discount — a true test needs people willing to actually pay, not just say something sounds nice.</li>
                    <li>Track how many said yes vs. how many actually followed through — that ratio is the honest signal, more useful than enthusiastic feedback alone.</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-2">
                    Rules on occasional or small-scale sales (e.g. a one-time community fundraiser) vary by state and don't substitute for proper registration once you're running this as an ongoing business — check with your local health department before treating informal testing as a repeatable sales channel.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(4)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-copper-400 hover:text-copper-600 transition-colors">
                    ← Back
                  </button>
                  <a href="/apply" className="flex-1 text-center bg-copper-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-copper-700 transition-colors">
                    Ready — Apply as a Cook →
                  </a>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Persistent summary sidebar */}
        <div className="w-full md:w-72 shrink-0 md:sticky md:top-6 flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your plan so far</p>

          {interested !== null && (
            <button onClick={() => jumpTo(0)} className="text-left bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs hover:border-copper-300">
              <span className="text-gray-400">Interested:</span> <span className="font-medium text-gray-800">{interested ? 'Yes' : 'No'}</span>
            </button>
          )}
          {step > 0 && goalAmount && (
            <button onClick={() => jumpTo(1)} className="text-left bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs hover:border-copper-300">
              <span className="text-gray-400">Goal:</span> <span className="font-medium text-gray-800">${goalAmount}/{goalPeriod}</span>
            </button>
          )}
          {step > 1 && foodType && arrangement && (
            <button onClick={() => jumpTo(2)} className="text-left bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs hover:border-copper-300">
              <span className="text-gray-400">Making:</span> <span className="font-medium text-gray-800">{foodTypeOption?.label}</span><br />
              <span className="text-gray-400">Arrangement:</span> <span className="font-medium text-gray-800">{arrangement === 'travel' ? 'Travel to client' : 'Cook at home'}</span><br />
              <span className="text-gray-400">State:</span> <span className="font-medium text-gray-800">{state || '—'}</span>
            </button>
          )}
          {step > 2 && profitPerUnit > 0 && unitsNeededPerMonth && (
            <button onClick={() => jumpTo(3)} className="text-left bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs hover:border-copper-300">
              <span className="text-gray-400">Profit/unit:</span> <span className="font-medium text-gray-800">{money(profitPerUnit)}</span><br />
              <span className="text-gray-400">Volume needed:</span> <span className="font-medium text-gray-800">{unitsNeededPerMonth}/month</span>
              {effectiveHourlyWage != null && (
                <><br /><span className="text-gray-400">Effective wage:</span> <span className="font-medium text-gray-800">{money(effectiveHourlyWage)}/hr</span></>
              )}
            </button>
          )}
          {step > 3 && setupPlan && setupPlan.items.length > 0 && (
            <button onClick={() => jumpTo(4)} className="text-left bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs hover:border-copper-300">
              <p className="text-gray-400 mb-1">Setup expenses:</p>
              {setupPlan.items.map(item => (
                <p key={item.label} className="text-gray-700">• {item.label}</p>
              ))}
              {setupPlan.knownTotal != null && (
                <p className="font-semibold text-copper-700 mt-1 pt-1 border-t border-gray-100">Known total: {money(setupPlan.knownTotal)}</p>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
