import { randomInt, createHash } from 'crypto'
import twilio from 'twilio'

const OTP_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5

export function generateOtp(): string {
  return String(randomInt(100000, 1000000))
}

export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()
}

export function isOtpExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() < Date.now()
}

export function isOtpLocked(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS
}

export async function sendStartJobOtp(toPhone: string, code: string) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  await client.messages.create({
    to: toPhone,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body: `Your CookMatch code is ${code}. Give this to your cook to confirm they've arrived to start the job. Expires in ${OTP_TTL_MINUTES} minutes.`,
  })
}
