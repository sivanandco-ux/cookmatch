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

// Normalizes an Indian mobile number to E.164 (+91XXXXXXXXXX), or returns
// null if invalid. Accepts an optional leading 91 or 0, and any mix of
// spaces/dashes. Indian mobile numbers are 10 digits starting with 6-9.
export function normalizeIndiaPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)

  if (digits.length !== 10) return null
  if (!/^[6-9]/.test(digits)) return null

  return `+91${digits}`
}

export function isValidIndiaPhone(raw: string): boolean {
  return normalizeIndiaPhone(raw) !== null
}

export function formatIndiaPhoneDisplay(raw: string): string {
  const e164 = normalizeIndiaPhone(raw)
  if (!e164) return raw
  const d = e164.slice(3)
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`
}

// Only US and India are supported for now — tries US first (the more
// common case for this platform), then India.
export function normalizePhone(raw: string): string | null {
  return normalizeUsPhone(raw) || normalizeIndiaPhone(raw)
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null
}

export function formatPhoneDisplay(raw: string): string {
  if (isValidUsPhone(raw)) return formatUsPhoneDisplay(raw)
  if (isValidIndiaPhone(raw)) return formatIndiaPhoneDisplay(raw)
  return raw
}
