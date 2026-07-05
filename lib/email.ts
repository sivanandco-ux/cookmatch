import { Resend } from 'resend'

const FROM = 'CookMatch <onboarding@resend.dev>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

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
  const { error } = await getResend().emails.send({
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
      <h3 style="margin-top:24px;">Your Sivan Spices gift 🎁</h3>
      <p>Use code <strong style="font-size:18px;color:#ea580c;">${discountCode}</strong> for 20% off your first order.</p>
      <p><a href="https://sivanspices.com" style="color:#ea580c;">Shop Sivan Spices →</a></p>
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
  const { error } = await getResend().emails.send({
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
      <h3 style="margin-top:24px;">Your Sivan Spices gift 🎁</h3>
      <p>Use code <strong style="font-size:18px;color:#ea580c;">${discountCode}</strong> for 20% off your first order.</p>
      <p><a href="https://sivanspices.com" style="color:#ea580c;">Shop Sivan Spices →</a></p>
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

  const { error } = await getResend().emails.send({
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
  const { error } = await getResend().emails.send({
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
  const { error } = await getResend().emails.send({
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

export async function sendBriefReceivedToCook({
  cookName,
  cookEmail,
  cookId,
  clientName,
  jobCategory,
  occasion,
  date,
  numPeople,
}: {
  cookName: string
  cookEmail: string
  cookId: string
  clientName: string
  jobCategory: string
  occasion: string
  date: string
  numPeople: number
}) {
  const dashboardUrl = `${SITE_URL}/dashboard/${cookId}`
  const categoryLabel: Record<string, string> = {
    family_cooking: 'Family Cooking',
    small_event: 'Small Event',
    medium_event: 'Medium Event',
  }
  const { error } = await getResend().emails.send({
    from: FROM,
    to: to(cookEmail),
    subject: `New session brief from ${clientName}`,
    html: `
      <p>Hi ${cookName},</p>
      <p>A client has submitted a session brief and wants you to cook for them. Review it on your dashboard and decide if you want to accept.</p>
      <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
        <tr><td><strong>Client</strong></td><td>${clientName}</td></tr>
        <tr><td><strong>Job type</strong></td><td>${categoryLabel[jobCategory] ?? jobCategory}</td></tr>
        <tr><td><strong>Occasion</strong></td><td>${occasion}</td></tr>
        <tr><td><strong>Date</strong></td><td>${date}</td></tr>
        <tr><td><strong>People</strong></td><td>${numPeople}</td></tr>
      </table>
      <p>The brief includes a voice memo and/or written description. Listen and read before deciding.</p>
      <p style="margin-top:24px;">
        <a href="${dashboardUrl}"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          Review &amp; Respond
        </a>
      </p>
      <p style="color:#9ca3af;font-size:13px;">Only accept if you are fully available on this date.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Brief received (cook) failed:', error.message)
}

export async function sendCookAcceptedToClient({
  clientName,
  clientEmail,
  cookName,
  bookingId,
  date,
}: {
  clientName: string
  clientEmail: string
  cookName: string
  bookingId: string
  date: string
}) {
  const confirmUrl = `${SITE_URL}/bookings/${bookingId}/confirm`
  const { error } = await getResend().emails.send({
    from: FROM,
    to: to(clientEmail),
    subject: `${cookName} accepted your session brief`,
    html: `
      <p>Hi ${clientName},</p>
      <p><strong>${cookName}</strong> has reviewed your session brief and wants to cook for you on <strong>${date}</strong>.</p>
      <p>To complete the booking, please confirm below. By confirming, you are committing to be home and ready for the cook on this date.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;color:#9a3412;font-weight:600;">Before you confirm:</p>
        <p style="margin:8px 0 0;color:#9a3412;font-size:14px;">This cook is reserving time specifically for you. Last-minute cancellations directly affect their income. Please only confirm if you are fully committed to this session.</p>
      </div>
      <p style="margin-top:24px;">
        <a href="${confirmUrl}"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          Confirm My Booking
        </a>
      </p>
      <p style="color:#9ca3af;font-size:13px;">You can also cancel from the same page if your plans have changed.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Cook accepted (client) failed:', error.message)
}

export async function sendSessionConfirmedToBoth({
  clientName,
  clientEmail,
  cookName,
  cookEmail,
  cookPhone,
  cookWhatsapp,
  clientPhone,
  date,
  discountCode,
}: {
  clientName: string
  clientEmail: string
  cookName: string
  cookEmail: string
  cookPhone: string
  cookWhatsapp: string | null
  clientPhone: string
  date: string
  discountCode: string
}) {
  const resend = getResend()
  await Promise.all([
    resend.emails.send({
      from: FROM,
      to: to(clientEmail),
      subject: `Confirmed — ${cookName} is cooking for you on ${date}`,
      html: `
        <p>Hi ${clientName},</p>
        <p>Your session is confirmed. Here is how to reach ${cookName}:</p>
        <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
          <tr><td><strong>Phone</strong></td><td>${cookPhone}</td></tr>
          <tr><td><strong>Email</strong></td><td>${cookEmail}</td></tr>
          ${cookWhatsapp ? `<tr><td><strong>WhatsApp</strong></td><td>${cookWhatsapp}</td></tr>` : ''}
          <tr><td><strong>Date</strong></td><td>${date}</td></tr>
        </table>
        <p>Please coordinate directly with ${cookName} for any final details.</p>
        <h3 style="margin-top:24px;">Your Sivan Spices gift 🎁</h3>
        <p>Use code <strong style="font-size:18px;color:#ea580c;">${discountCode}</strong> for 20% off at Sivan Spices.com</p>
        <p><a href="https://sivanspices.com" style="color:#ea580c;">Shop Sivan Spices →</a></p>
        <p>— CookMatch Team</p>
      `,
    }),
    resend.emails.send({
      from: FROM,
      to: to(cookEmail),
      subject: `Confirmed — ${clientName} is expecting you on ${date}`,
      html: `
        <p>Hi ${cookName},</p>
        <p>The booking is confirmed. Here is how to reach ${clientName}:</p>
        <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
          <tr><td><strong>Phone</strong></td><td>${clientPhone}</td></tr>
          <tr><td><strong>Date</strong></td><td>${date}</td></tr>
        </table>
        <p>Coordinate directly with the client for directions, parking, and any final details.</p>
        <p>— CookMatch Team</p>
      `,
    }),
  ]).catch(err => console.error('[Email] Session confirmed failed:', err))
}

export async function sendCookInterestedToClient({
  clientName,
  clientEmail,
  cookName,
  cookPhone,
  cookEmail,
  cookWhatsapp,
  jobPostId,
  interestId,
  jobCategory,
  occasion,
  date,
}: {
  clientName: string
  clientEmail: string
  cookName: string
  cookPhone: string
  cookEmail: string
  cookWhatsapp: string | null
  jobPostId: string
  interestId: string
  jobCategory: string
  occasion: string
  date: string
}) {
  const confirmUrl = `${SITE_URL}/jobs/${jobPostId}/confirm?interest_id=${interestId}`
  const categoryLabel: Record<string, string> = {
    family_cooking: 'Family Cooking',
    small_event: 'Small Event',
    medium_event: 'Medium Event',
  }
  const { error } = await getResend().emails.send({
    from: FROM,
    to: to(clientEmail),
    subject: `${cookName} wants to cook for you`,
    html: `
      <p>Hi ${clientName},</p>
      <p><strong>${cookName}</strong> has seen your job post and wants to cook for you on <strong>${date}</strong>.</p>
      <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
        <tr><td><strong>Job type</strong></td><td>${categoryLabel[jobCategory] ?? jobCategory}</td></tr>
        <tr><td><strong>Occasion</strong></td><td>${occasion}</td></tr>
        <tr><td><strong>Date</strong></td><td>${date}</td></tr>
      </table>

      <h3 style="margin-top:24px;">Step 1 — Contact ${cookName} to discuss details</h3>
      <p>Before you confirm, reach out to ${cookName} directly to agree on the arrival time, menu, and any other details.</p>
      <table cellpadding="6" style="border-collapse:collapse;margin:12px 0;">
        <tr><td><strong>Phone</strong></td><td>${cookPhone}</td></tr>
        <tr><td><strong>Email</strong></td><td>${cookEmail}</td></tr>
        ${cookWhatsapp ? `<tr><td><strong>WhatsApp</strong></td><td>${cookWhatsapp}</td></tr>` : ''}
      </table>

      <h3 style="margin-top:24px;">Step 2 — Confirm once you are ready</h3>
      <p>Once you have spoken with ${cookName} and everything looks good, confirm the booking below to lock it in.</p>
      <p style="margin-top:16px;">
        <a href="${confirmUrl}"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          Confirm Booking
        </a>
      </p>
      <p style="color:#9ca3af;font-size:13px;">If this cook is not a good fit after your conversation, simply ignore this email and wait — other cooks may express interest too.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Cook interested (client) failed:', error.message)
}

export async function sendSessionReminder({
  clientName,
  clientEmail,
  cookName,
  cookEmail,
  date,
  time,
  type,
}: {
  clientName: string
  clientEmail: string
  cookName: string
  cookEmail: string
  date: string
  time: string | null
  type: '24hr' | '2hr'
}) {
  const when = type === '24hr' ? 'tomorrow' : 'in about 2 hours'
  const resend = getResend()
  await Promise.all([
    resend.emails.send({
      from: FROM,
      to: to(clientEmail),
      subject: `Reminder — ${cookName} is cooking for you ${when}`,
      html: `
        <p>Hi ${clientName},</p>
        <p>This is a reminder that <strong>${cookName}</strong> will be at your home ${when}.</p>
        <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
          <tr><td><strong>Date</strong></td><td>${date}</td></tr>
          ${time ? `<tr><td><strong>Time</strong></td><td>${time}</td></tr>` : ''}
        </table>
        <p>Make sure the kitchen is accessible and any agreed ingredients are ready.</p>
        <p>— CookMatch Team</p>
      `,
    }),
    resend.emails.send({
      from: FROM,
      to: to(cookEmail),
      subject: `Reminder — ${clientName} is expecting you ${when}`,
      html: `
        <p>Hi ${cookName},</p>
        <p>This is a reminder that you have a confirmed session with <strong>${clientName}</strong> ${when}.</p>
        <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
          <tr><td><strong>Date</strong></td><td>${date}</td></tr>
          ${time ? `<tr><td><strong>Time</strong></td><td>${time}</td></tr>` : ''}
        </table>
        <p>Please contact the client if anything has changed.</p>
        <p>— CookMatch Team</p>
      `,
    }),
  ]).catch(err => console.error('[Email] Session reminder failed:', err))
}

export async function sendWelcomeEmail({
  cookName,
  cookEmail,
  cookId,
}: {
  cookName: string
  cookEmail: string
  cookId: string
}) {
  const dashboardUrl = `${SITE_URL}/dashboard/${cookId}`
  const jobBoardUrl = `${SITE_URL}/jobs?cook_id=${cookId}`
  const availabilityUrl = `${SITE_URL}/availability/${cookId}`
  const { error } = await getResend().emails.send({
    from: FROM,
    to: to(cookEmail),
    subject: `Welcome to CookMatch — you are approved!`,
    html: `
      <p>Hi ${cookName},</p>
      <p>Great news — your CookMatch application has been approved. You are now an active cook on our platform.</p>

      <h3 style="margin-top:24px;">Your dashboard</h3>
      <p>This is your home base. You can see session briefs from clients, respond to job postings, and manage your bookings here. <strong>Save this link</strong> — you will use it every time you log in.</p>
      <p style="margin-top:16px;">
        <a href="${dashboardUrl}"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          Go to My Dashboard
        </a>
      </p>

      <h3 style="margin-top:32px;">What to do next</h3>
      <ol style="padding-left:20px;line-height:1.8;">
        <li><a href="${availabilityUrl}" style="color:#ea580c;">Update your availability</a> so clients can see when you are free</li>
        <li><a href="${jobBoardUrl}" style="color:#ea580c;">Check the job board</a> for clients already looking for a cook</li>
      </ol>

      <p style="margin-top:24px;color:#6b7280;font-size:13px;">
        Your dashboard link: <a href="${dashboardUrl}" style="color:#ea580c;">${dashboardUrl}</a>
      </p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Welcome email failed:', error.message)
}

export async function sendCookInterestNotification({
  cookName,
  cookEmail,
  cookId,
  clientName,
  clientPhone,
  clientEmail,
  jobId,
  jobCategory,
  occasion,
  date,
  numPeople,
  city,
}: {
  cookName: string
  cookEmail: string
  cookId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  jobId: string
  jobCategory: string
  occasion: string
  date: string
  numPeople: number
  city: string
}) {
  const dashboardUrl = `${SITE_URL}/dashboard/${cookId}`
  const categoryLabel: Record<string, string> = {
    family_cooking: 'Family Cooking',
    small_event: 'Small Event',
    medium_event: 'Medium Event',
  }
  const { error } = await getResend().emails.send({
    from: FROM,
    to: to(cookEmail),
    subject: `You expressed interest — contact the client and confirm when ready`,
    html: `
      <p>Hi ${cookName},</p>
      <p>You expressed interest in a job in <strong>${city}</strong>. Here are the client's contact details so you can reach out to discuss the details.</p>
      <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
        <tr><td><strong>Job type</strong></td><td>${categoryLabel[jobCategory] ?? jobCategory}</td></tr>
        <tr><td><strong>Occasion</strong></td><td>${occasion}</td></tr>
        <tr><td><strong>Date</strong></td><td>${date}</td></tr>
        <tr><td><strong>People</strong></td><td>${numPeople}</td></tr>
      </table>

      <h3 style="margin-top:24px;">Step 1 — Contact the client</h3>
      <table cellpadding="6" style="border-collapse:collapse;margin:12px 0;">
        <tr><td><strong>Name</strong></td><td>${clientName}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${clientPhone}</td></tr>
        <tr><td><strong>Email</strong></td><td>${clientEmail}</td></tr>
      </table>

      <h3 style="margin-top:24px;">Step 2 — Confirm from your dashboard</h3>
      <p>Once you have spoken with the client and are ready to commit, confirm your availability on your dashboard.</p>
      <p style="margin-top:16px;">
        <a href="${dashboardUrl}"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          Go to My Dashboard
        </a>
      </p>
      <p style="color:#9ca3af;font-size:13px;">The booking only locks in once both you and the client have confirmed.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error('[Email] Cook interest notification failed:', error.message)
}

export async function sendNewJobNotification({
  cookName,
  cookEmail,
  cookId,
  jobId,
  jobCategory,
  occasion,
  city,
  numPeople,
  needsGrocery,
  needsCleanup,
}: {
  cookName: string
  cookEmail: string
  cookId: string
  jobId: string
  jobCategory: string
  occasion: string
  city: string
  numPeople: number
  needsGrocery: boolean
  needsCleanup: boolean
}) {
  const jobUrl = `${SITE_URL}/jobs/${jobId}?cook_id=${cookId}`
  const dashboardUrl = `${SITE_URL}/dashboard/${cookId}`
  const categoryLabel: Record<string, string> = {
    family_cooking: 'Family Cooking',
    small_event: 'Small Event',
    medium_event: 'Medium Event',
  }
  const { error } = await getResend().emails.send({
    from: FROM,
    to: to(cookEmail),
    subject: `New job posted in ${city} — ${categoryLabel[jobCategory] ?? jobCategory}`,
    html: `
      <p>Hi ${cookName},</p>
      <p>A new job has been posted on CookMatch that may be a good fit for you.</p>
      <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
        <tr><td><strong>Type</strong></td><td>${categoryLabel[jobCategory] ?? jobCategory}</td></tr>
        <tr><td><strong>Occasion</strong></td><td>${occasion}</td></tr>
        <tr><td><strong>Location</strong></td><td>${city}</td></tr>
        <tr><td><strong>People</strong></td><td>${numPeople}</td></tr>
        ${needsGrocery ? '<tr><td><strong>Note</strong></td><td>Grocery pickup needed</td></tr>' : ''}
        ${needsCleanup ? '<tr><td><strong>Note</strong></td><td>Cleanup needed</td></tr>' : ''}
      </table>
      <p>View the full brief and express interest before another cook gets it.</p>
      <p style="margin-top:24px;">
        <a href="${jobUrl}"
           style="background:#ea580c;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">
          View Job Brief
        </a>
      </p>
      <p style="margin-top:12px;">
        <a href="${dashboardUrl}" style="color:#ea580c;">Go to my dashboard →</a>
      </p>
      <p style="color:#9ca3af;font-size:13px;">You are receiving this because you are a verified cook on CookMatch.</p>
      <p>— CookMatch Team</p>
    `,
  })
  if (error) console.error(`[Email] New job notification failed for ${cookEmail}:`, error.message)
}

export async function sendJobReport({
  jobId,
  cookId,
  cookName,
  reason,
  details,
}: {
  jobId: string
  cookId: string
  cookName: string
  reason: string
  details: string
}) {
  const jobUrl = `${SITE_URL}/jobs/${jobId}?cook_id=${cookId}`
  const { error } = await getResend().emails.send({
    from: FROM,
    to: 'sivanandco1904@gmail.com',
    subject: `Job reported by cook — ${reason}`,
    html: `
      <p>A cook has flagged a job post for review.</p>
      <table cellpadding="6" style="border-collapse:collapse;margin:16px 0;">
        <tr><td><strong>Job ID</strong></td><td>${jobId}</td></tr>
        <tr><td><strong>Reported by</strong></td><td>${cookName} (${cookId})</td></tr>
        <tr><td><strong>Reason</strong></td><td>${reason}</td></tr>
        ${details ? `<tr><td><strong>Details</strong></td><td>${details}</td></tr>` : ''}
      </table>
      <p><a href="${jobUrl}" style="color:#ea580c;">View job post →</a></p>
      <p>— CookMatch System</p>
    `,
  })
  if (error) console.error('[Email] Job report failed:', error.message)
}

export async function sendDormantNotification({
  cookName,
  cookEmail,
}: {
  cookName: string
  cookEmail: string
}) {
  const { error } = await getResend().emails.send({
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
