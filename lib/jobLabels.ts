export const CATEGORY_LABELS: Record<string, string> = {
  family_cooking: 'Family Cooking',
  small_event: 'Small Event',
  medium_event: 'Medium Event',
}

// A job/booking is either a cooking session (sized by CATEGORY_LABELS) or a
// request to buy a specific ready-made item — the latter has no meaningful
// "family/small/medium" sizing, so it gets its own label regardless of
// whatever job_category was defaulted to under the hood.
export function getRequestLabel(jobCategory: string | null | undefined, requestType: string | null | undefined): string {
  if (requestType === 'item') return 'Item Order'
  if (!jobCategory) return 'Request'
  return CATEGORY_LABELS[jobCategory] ?? jobCategory
}
