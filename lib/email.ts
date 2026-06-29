import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'CookMatch <onboarding@resend.dev>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// In demo mode, Resend only allows sending to your own account email.
// Set RESEND_TEST_EMAIL to override all recipients. Remove in production.
function to(email: string) {
  return process.env.RESEND_TEST_EMAIL || email
}

export async function sendCookNotification({
  cookName,
  cookEmail,
  clientName,
  clientPhone,
  date,
  occasion,
  groupSize,
  notes,
  discountCode,
}: {
  cookName: string
  cookEmail: string
  clientName: string
  clientPhone: string
  date: string
  occasion: string
  groupSize: string
  notes: string
  discountCode: string
}) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: to(cookEmail),
    subject: `New booking inquiry from ${clientName}`,
    html: `
      <p>Hi ${cookName},</p>
      <p>You have a new booking inquiry on CookMatch.</p>
      <table cellpadding="6" style="border-collapse:collapse;">
        <tr><td><strong>Client</strong></td><td>${clientName}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${clientPhone}</td></tr>
        <tr><td><strong>Date</strong></td><td>${date}</td></tr>
        <tr><td><strong>Occasion</strong></td><td>${occasion}</td></tr>
        <tr><td><strong>Group size</strong></td><td>${groupSize}</td></tr>
        ${notes ? `<tr><td><strong>Notes</strong></td><td>${notes}</td></tr>` : ''}
      </table>
      <p>Reach out to ${clientName} at <strong>${clientPhone}</strong> to confirm.</p>
      <h3 style="margin-top:24px;">Your SivanSpices gift 🎁</h3>
      <p>Use code <strong style="font-size:18px;color:#ea580c;">${discountCode}</strong> for 20% off your first order.</p>
      <p><a href="https://sivanspices.com" style="color:#ea580c;">Shop SivanSpices →</a></p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Cook notification failed:', error.message)
}

export async function sendClientConfirmation({
  clientName,
  clientEmail,
  cookName,
  cookPhone,
  cookEmail,
  cookWhatsapp,
  date,
  discountCode,
}: {
  clientName: string
  clientEmail: string
  cookName: string
  cookPhone: string
  cookEmail: string
  cookWhatsapp: string | null
  date: string
  discountCode: string
}) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: to(clientEmail),
    subject: `Your booking request to ${cookName} was sent`,
    html: `
      <p>Hi ${clientName},</p>
      <p>Your booking request has been sent to <strong>${cookName}</strong>. They will contact you to confirm the details.</p>
      <table cellpadding="6" style="border-collapse:collapse;margin-bottom:16px;">
        <tr><td><strong>Cook</strong></td><td>${cookName}</td></tr>
        <tr><td><strong>Date</strong></td><td>${date}</td></tr>
      </table>
      <h3 style="margin-top:24px;">Contact ${cookName} directly:</h3>
      <ul>
        <li>Phone: ${cookPhone}</li>
        <li>Email: ${cookEmail}</li>
        ${cookWhatsapp ? `<li>WhatsApp: ${cookWhatsapp}</li>` : ''}
      </ul>
      <h3 style="margin-top:24px;">Your SivanSpices gift 🎁</h3>
      <p>Use code <strong style="font-size:18px;color:#ea580c;">${discountCode}</strong> for 20% off your first order.</p>
      <p><a href="https://sivanspices.com" style="color:#ea580c;">Shop SivanSpices →</a></p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Client confirmation failed:', error.message)
}

export async function sendCookWatchNotification({
  cookName,
  cookEmail,
  analysis,
  modules,
  scores,
}: {
  cookName: string
  cookEmail: string
  analysis: string
  modules: string[]
  scores: {
    taste: number
    cleanliness: number
    punctuality: number
    respect: number
    clean_appearance: number
    overall: number
  }
}) {
  const scoreRow = (label: string, value: number) => {
    const stars = Math.round(value)
    const filled = '★'.repeat(stars)
    const empty = '☆'.repeat(5 - stars)
    return `<tr>
      <td style="padding:4px 12px 4px 0;color:#374151;">${label}</td>
      <td style="padding:4px 0;color:#ea580c;letter-spacing:2px;">${filled}${empty}</td>
      <td style="padding:4px 0 4px 8px;color:#6b7280;font-size:13px;">${value.toFixed(1)} / 5.0</td>
    </tr>`
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: to(cookEmail),
    subject: `Important: Feedback on your recent session`,
    html: `
      <p>Hi ${cookName},</p>
      <p>A client shared feedback after their recent session that we want you to be aware of.</p>

      <h3 style="margin-top:24px;">Your session scores:</h3>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${scoreRow('Taste', scores.taste)}
        ${scoreRow('Cleanliness', scores.cleanliness)}
        ${scoreRow('Punctuality', scores.punctuality)}
        ${scoreRow('Respect', scores.respect)}
        ${scoreRow('Clean Appearance', scores.clean_appearance)}
        <tr><td colspan="3" style="padding-top:8px;border-top:1px solid #e5e7eb;"></td></tr>
        ${scoreRow('Overall average', scores.overall)}
      </table>

      <h3 style="margin-top:24px;">What this means:</h3>
      <blockquote style="border-left:3px solid #ea580c;padding-left:12px;color:#374151;margin:12px 0;">
        ${analysis}
      </blockquote>

      <h3 style="margin-top:24px;">Focus areas for your next session:</h3>
      <ul>
        ${modules.map(m => `<li style="margin-bottom:4px;">${m}</li>`).join('')}
      </ul>

      <p style="margin-top:24px;">You have <strong>one upcoming session</strong> to show improvement before your profile is placed in training mode. We believe in you.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Cook watch notification failed:', error.message)
}

export async function sendFeedbackRequest({
  clientName,
  clientEmail,
  cookName,
  bookingId,
}: {
  clientName: string
  clientEmail: string
  cookName: string
  bookingId: string
}) {
  const feedbackUrl = `${SITE_URL}/feedback?booking=${bookingId}`
  const { error } = await resend.emails.send({
    from: FROM,
    to: to(clientEmail),
    subject: `How was your session with ${cookName}?`,
    html: `
      <p>Hi ${clientName},</p>
      <p>We hope you had a wonderful cooking session with <strong>${cookName}</strong> today!</p>
      <p>Your feedback helps us maintain quality and helps ${cookName} grow on CookMatch.</p>
      <p style="margin-top:24px;">
        <a href="${feedbackUrl}"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          Leave Feedback
        </a>
      </p>
      <p style="color:#9ca3af;font-size:13px;">Takes less than 2 minutes.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Feedback request failed:', error.message)
}

export async function sendCheckinEmail({
  cookName,
  cookEmail,
  availabilityUrl,
}: {
  cookName: string
  cookEmail: string
  availabilityUrl: string
}) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: to(cookEmail),
    subject: `Please confirm your availability this week`,
    html: `
      <p>Hi ${cookName},</p>
      <p>It's Monday — time to update your availability for the next 3 weeks so clients can find and book you.</p>
      <p style="margin-top:24px;">
        <a href="${availabilityUrl}"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          Update My Availability
        </a>
      </p>
      <p style="color:#9ca3af;font-size:13px;margin-top:16px;">Takes less than a minute. Keeping your availability up to date ensures you get more bookings.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Check-in email failed:', error.message)
}

export async function sendDormantNotification({
  cookName,
  cookEmail,
}: {
  cookName: string
  cookEmail: string
}) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: to(cookEmail),
    subject: `Your CookMatch profile has been paused`,
    html: `
      <p>Hi ${cookName},</p>
      <p>We haven't heard from you in over 60 days, so your CookMatch profile has been temporarily paused and is no longer visible to clients.</p>
      <p>To reactivate your profile, simply reply to this email or contact us at <a href="mailto:contact@sivanspices.com" style="color:#ea580c;">contact@sivanspices.com</a>.</p>
      <p>We'd love to have you back.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Dormant notification failed:', error.message)
}
