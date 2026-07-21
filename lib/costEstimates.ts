import type { FoodType } from './foodLawReference'

// Planning heuristics, NOT verified facts — unlike foodLawReference.ts
// (permit fees, revenue caps, sourced from official agency documents),
// these are general small-food-business rules of thumb used to give a
// cook a starting estimate when they don't yet know their own ingredient
// and packaging costs. "Food cost as a percentage of price" is a widely
// cited planning concept (commonly 25-35% in food service), not a number
// specific to any state or product. Always shown as an editable estimate
// in the UI, never presented with the same confidence as a sourced fee.
export const DEFAULT_COST_ESTIMATE: Record<FoodType, { ingredientPct: number; packagingFlat: number }> = {
  baked: { ingredientPct: 0.25, packagingFlat: 0.75 },
  jams: { ingredientPct: 0.30, packagingFlat: 1.0 },
  candies: { ingredientPct: 0.25, packagingFlat: 0.75 },
  perishable: { ingredientPct: 0.30, packagingFlat: 1.5 },
  meals: { ingredientPct: 0.30, packagingFlat: 1.0 },
}

export function estimateCosts(foodType: FoodType, price: number): { ingredientCost: number; packagingCost: number } {
  const { ingredientPct, packagingFlat } = DEFAULT_COST_ESTIMATE[foodType]
  return {
    ingredientCost: Math.round(price * ingredientPct * 100) / 100,
    packagingCost: packagingFlat,
  }
}
