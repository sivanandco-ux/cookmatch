// Normalizes a US phone number to E.164 (+1XXXXXXXXXX), or returns null if invalid.
// Accepts an optional leading country code (1) and any mix of spaces/dashes/dots/parens.
export function normalizeUsPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  const tenDigits = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits

  if (tenDigits.length !== 10) return null
  // NANP: area code and exchange code can't start with 0 or 1
  if (/^[01]/.test(tenDigits) || /^[01]/.test(tenDigits.slice(3))) return null

  return `+1${tenDigits}`
}

export function isValidUsPhone(raw: string): boolean {
  return normalizeUsPhone(raw) !== null
}

export function formatUsPhoneDisplay(raw: string): string {
  const e164 = normalizeUsPhone(raw)
  if (!e164) return raw
  const d = e164.slice(2)
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}
