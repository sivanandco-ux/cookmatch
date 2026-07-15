export const CATEGORY_LABELS: Record<string, string> = {
  family_cooking: 'Family Cooking',
  small_event: 'Small Event',
  medium_event: 'Medium Event',
}

// A job/booking is either a cooking session (sized by CATEGORY_LABELS) or a
// request to buy a specific ready-made item — the latter has no meaningful
// "family/small/medium" sizing. For item orders, the actual item name
// (stored in specific_dishes) is far more useful in a header/list than the
// generic "Item Order" — "Item Order" is only a fallback when no item name
// was given.
export function getRequestLabel(jobCategory: string | null | undefined, requestType: string | null | undefined, itemName?: string | null): string {
  if (requestType === 'item') return itemName?.trim() ? itemName.trim() : 'Item Order'
  if (!jobCategory) return 'Request'
  return CATEGORY_LABELS[jobCategory] ?? jobCategory
}
