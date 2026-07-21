import type { FoodType } from './foodLawReference'

// Same planning-heuristic tier as costEstimates.ts, not verified facts —
// typical retail price ranges for common equipment, meant to give a cook
// a starting budget, not a precise figure. Assumes starting from
// scratch; a cook who already bakes/cooks regularly may already own some
// of this and can subtract those items themselves.

export interface EquipmentItem {
  item: string
  minCost: number
  maxCost: number
}

// Cook-at-home path: a full kitchen setup for that food type, since the
// cook is equipping their own kitchen to produce at volume.
export const HOME_EQUIPMENT: Record<FoodType, EquipmentItem[]> = {
  baked: [
    { item: 'Stand or hand mixer', minCost: 30, maxCost: 300 },
    { item: 'Baking sheets (set)', minCost: 15, maxCost: 40 },
    { item: 'Cooling racks', minCost: 10, maxCost: 25 },
    { item: 'Oven thermometer', minCost: 8, maxCost: 15 },
    { item: 'Mixing bowls (set)', minCost: 15, maxCost: 35 },
    { item: 'Digital kitchen scale', minCost: 15, maxCost: 25 },
    { item: 'Measuring cups & spoons', minCost: 10, maxCost: 20 },
    { item: 'Cake/loaf pans', minCost: 15, maxCost: 40 },
  ],
  jams: [
    { item: 'Large stainless steel pot', minCost: 30, maxCost: 80 },
    { item: 'Canning jars (set)', minCost: 15, maxCost: 30 },
    { item: 'Jar lifter/tongs', minCost: 8, maxCost: 15 },
    { item: 'Candy/jam thermometer', minCost: 10, maxCost: 20 },
    { item: 'Wide-mouth funnel', minCost: 5, maxCost: 10 },
    { item: 'Digital kitchen scale', minCost: 15, maxCost: 25 },
  ],
  candies: [
    { item: 'Candy thermometer', minCost: 10, maxCost: 20 },
    { item: 'Heavy-bottomed saucepan', minCost: 25, maxCost: 60 },
    { item: 'Silicone molds', minCost: 10, maxCost: 25 },
    { item: 'Digital kitchen scale', minCost: 15, maxCost: 25 },
    { item: 'Airtight storage containers', minCost: 15, maxCost: 30 },
  ],
  perishable: [
    { item: 'Stand mixer', minCost: 30, maxCost: 300 },
    { item: 'Springform pans', minCost: 15, maxCost: 30 },
    { item: 'Food thermometer', minCost: 8, maxCost: 15 },
    { item: 'Piping bags & tips', minCost: 10, maxCost: 20 },
    { item: 'Heatproof mixing bowls', minCost: 15, maxCost: 30 },
  ],
  meals: [
    { item: "Chef's knife & cutting board", minCost: 30, maxCost: 80 },
    { item: 'Large stock pot', minCost: 30, maxCost: 70 },
    { item: 'Food thermometer', minCost: 8, maxCost: 15 },
    { item: 'Sheet pans', minCost: 15, maxCost: 30 },
    { item: 'Delivery-safe storage containers', minCost: 15, maxCost: 30 },
  ],
}

// Travel-to-client path: the client's kitchen provides the big
// appliances (oven, stovetop, mixer) — a traveling cook mainly needs
// personal tools they bring with them.
export const TRAVEL_EQUIPMENT: EquipmentItem[] = [
  { item: "Knife roll with your own knives", minCost: 40, maxCost: 150 },
  { item: 'Apron', minCost: 10, maxCost: 30 },
  { item: 'Food thermometer', minCost: 8, maxCost: 15 },
  { item: 'Measuring cups & spoons', minCost: 10, maxCost: 20 },
  { item: 'Insulated bag or cooler for transport', minCost: 20, maxCost: 50 },
  { item: 'Cutting board (your own)', minCost: 10, maxCost: 25 },
]

export function getEquipmentList(foodType: FoodType, arrangement: 'travel' | 'home'): EquipmentItem[] {
  return arrangement === 'travel' ? TRAVEL_EQUIPMENT : HOME_EQUIPMENT[foodType]
}
