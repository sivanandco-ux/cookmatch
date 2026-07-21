// Shared factual reference for the cook-planning wizard (components/CookPlanner.tsx).
// Numbers here are the same verified-as-of-2026-07-09 figures used in
// app/api/chat/education/route.ts (California/Alameda County specific — see
// that file's source comment). Keep the two in sync if either changes.
// Never add a specific dollar figure for a state other than California —
// the same rule the education chatbot follows, for the same reason: we
// haven't verified fees/caps for the other 49 states, only agency names.

export type FoodType = 'baked' | 'jams' | 'candies' | 'perishable' | 'meals'
export type Arrangement = 'travel' | 'home'

export interface FoodTypeOption {
  value: FoodType
  label: string
  description: string
  shelfStable: boolean
}

export const FOOD_TYPE_OPTIONS: FoodTypeOption[] = [
  { value: 'baked', label: 'Baked goods', description: 'Cookies, bread, dry cakes — no perishable filling', shelfStable: true },
  { value: 'jams', label: 'Jams & preserves', description: 'Jams, jellies, pickles', shelfStable: true },
  { value: 'candies', label: 'Candies & snacks', description: 'Candy, roasted nuts, granola, dried spice mixes', shelfStable: true },
  { value: 'perishable', label: 'Perishable desserts', description: 'Tiramisu, cheesecake, cream-filled pastries — needs refrigeration even though it’s not served hot', shelfStable: false },
  { value: 'meals', label: 'Full meals', description: 'Curries, rice dishes, other hot cooked food', shelfStable: false },
]

// The only 9 states (as of 2026) with a legalized path for selling
// perishable/TCS food (hot meals, or cold-but-perishable items like
// tiramisu) from a home kitchen at all. Matches the list in
// app/api/chat/education/route.ts.
export const HOME_MEAL_LAW_STATES = [
  'Wyoming', 'Montana', 'North Dakota', 'Oklahoma', 'Iowa', 'Texas', 'Tennessee', 'Utah', 'California',
]

export const CA_MEHKO = {
  permitFee: 696,
  mealsPerDayCap: 30,
  mealsPerMonthCap: 30 * 30, // approximate, matches the "~900/month" figure used in guidance
  annualRevenueCap: 100000,
}

export const CA_COTTAGE_FOOD = {
  classA: { annualRevenueCap: 88000 },
  classB: { annualRevenueCap: 176000 },
}

export const CA_FOOD_HANDLER_CARD = {
  minCost: 7,
  maxCost: 15,
}
