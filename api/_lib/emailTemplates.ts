// Branded HTML emails (table layout + inline styles, which is what email clients need).
// The logo is referenced as cid:jobearly-logo and attached by mailer.ts.

const SITE = (process.env.PUBLIC_SITE_URL || 'https://www.getjobearly.com').replace(/\/$/, '')
const SUPPORT_EMAIL = 'jobearlyteam@gmail.com'

const BRAND = '#2563EB'
const BRAND_DARK = '#1D4ED8'
const INK = '#0F172A'
const MUTE = '#64748B'
const LINE = '#E2E8F0'
const FONT = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif"

export interface Email {
  subject: string
  html: string
  text: string
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

const METHOD_LABELS: Record<string, string> = {
  upi: 'UPI', card: 'Card', netbanking: 'Netbanking', wallet: 'Wallet', emandate: 'eMandate', emi: 'EMI',
}

function button(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;">
      <tr><td align="center" bgcolor="${BRAND}" style="border-radius:10px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;background:linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%);">${label}</a>
      </td></tr>
    </table>`
}

function signOff(): string {
  return `
    <p style="margin:28px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${INK};">
      Regards,<br><strong style="color:${BRAND};">JobEarly team</strong>
    </p>`
}

function layout(opts: { preheader: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>JobEarly</title>
</head>
<body style="margin:0;padding:0;background:#EEF2FF;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EEF2FF">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(37,99,235,0.12);">

        <!-- Header -->
        <tr><td bgcolor="${BRAND}" style="background:linear-gradient(135deg,${BRAND} 0%,${BRAND_DARK} 100%);padding:28px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="padding-right:12px;"><img src="cid:jobearly-logo" width="44" height="44" alt="JobEarly" style="display:block;border:0;border-radius:12px;background:#ffffff;padding:4px;"></td>
            <td style="font-family:${FONT};font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">JobEarly</td>
          </tr></table>
          <p style="margin:14px 0 0;font-family:${FONT};font-size:13px;color:#DBEAFE;letter-spacing:0.4px;">Get hired before everyone else.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 32px 32px;font-family:${FONT};color:${INK};">
          ${opts.body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8FAFC;border-top:1px solid ${LINE};padding:22px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTE};">
          You're receiving this because you have a JobEarly account.<br>
          Questions? Just reply, or write to <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND};text-decoration:none;">${SUPPORT_EMAIL}</a>.<br>
          <a href="${SITE}/terms" style="color:${MUTE};">Terms</a> &nbsp;·&nbsp; <a href="${SITE}/privacy" style="color:${MUTE};">Privacy</a> &nbsp;·&nbsp; <a href="${SITE}/refund" style="color:${MUTE};">Refunds</a>
        </td></tr>
      </table>
      <p style="margin:18px 0 0;font-family:${FONT};font-size:11px;color:#94A3B8;">© ${new Date().getFullYear()} JobEarly</p>
    </td></tr>
  </table>
</body>
</html>`
}

function featureRow(emoji: string, title: string, text: string): string {
  return `
    <tr>
      <td width="40" valign="top" style="padding:10px 0;font-size:22px;line-height:1;">${emoji}</td>
      <td valign="top" style="padding:10px 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${MUTE};">
        <strong style="color:${INK};font-size:15px;">${title}</strong><br>${text}
      </td>
    </tr>`
}

// ── Welcome (sent at signup) ───────────────────────────────────────────────
export function welcomeEmail(opts: { firstName: string }): Email {
  const first = esc(opts.firstName)
  const body = `
    <h1 style="margin:0 0 14px;font-family:${FONT};font-size:28px;line-height:1.2;font-weight:800;color:${INK};">Welcome to JobEarly, ${first}! 🎉</h1>
    <p style="margin:0 0 22px;font-family:${FONT};font-size:16px;line-height:1.65;color:${MUTE};">
      Thank you for signing up — we're so glad you're here. JobEarly helps you apply faster, smarter, and earlier than the competition.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};margin:8px 0;">
      ${featureRow('📄', 'Tailored resumes', 'Rewritten to match each job description, in your own voice.')}
      ${featureRow('🎯', 'ATS scoring', 'See exactly what applicant-tracking filters see — and fix it.')}
      ${featureRow('✍️', 'Cover letters', 'Specific and achievement-focused, never generic filler.')}
      ${featureRow('📬', 'Smart outreach', 'Email recruiters straight from your own Gmail.')}
    </table>
    ${button('Open your dashboard', `${SITE}/app/dashboard`)}
    <p style="margin:18px 0 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${MUTE};">We look forward to you using JobEarly. If you ever get stuck, just reply to this email.</p>
    ${signOff()}`

  return {
    subject: 'Welcome to JobEarly 🚀',
    html: layout({ preheader: `Thank you for signing up, ${opts.firstName}! Here's how to get started.`, body }),
    text: `Hi ${opts.firstName},\n\nThank you for signing up, and we look forward to you using JobEarly.\n\nGet started: ${SITE}/app/dashboard\n\nRegards,\nJobEarly team`,
  }
}

// ── Payment receipt (to the customer) ──────────────────────────────────────
export interface ReceiptData {
  firstName: string
  interval: 'monthly' | 'annual'
  amountRupees: number
  method?: string
  paymentId: string
  subscriptionId: string
  paidAt: Date
  renewsAt: Date | null
  isRenewal: boolean
}

const PRO_FEATURES = [
  'Unlimited AI-tailored resumes',
  'Advanced ATS readiness audits',
  'Unlimited cover letters',
  'Smart Outreach with reply tracking',
  'Performance analytics + insights',
  'Priority human + AI support',
]

function detailRow(label: string, value: string, strong = false): string {
  return `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid ${LINE};font-family:${FONT};font-size:14px;color:${MUTE};">${label}</td>
      <td align="right" style="padding:11px 0;border-bottom:1px solid ${LINE};font-family:${FONT};font-size:14px;color:${INK};${strong ? 'font-weight:700;' : ''}">${value}</td>
    </tr>`
}

export function receiptEmail(d: ReceiptData): Email {
  const first = esc(d.firstName)
  const planLabel = d.interval === 'annual' ? 'JobEarly Pro — 1 year' : 'JobEarly Pro — 1 month'
  const amount = formatRupees(d.amountRupees)
  const method = d.method ? METHOD_LABELS[d.method] ?? d.method : null
  const renews = d.renewsAt ? formatDate(d.renewsAt) : null

  const heading = d.isRenewal ? 'Your JobEarly Pro has renewed ✅' : "You're on JobEarly Pro! 🚀"
  const intro = d.isRenewal
    ? `Hi ${first}, your subscription renewed successfully. Thank you for staying with us — here's your receipt.`
    : `Hi ${first}, thank you for subscribing! Your payment went through and Pro is now active on your account. Here's your receipt.`

  const features = PRO_FEATURES.map(f => `
    <tr>
      <td width="26" valign="top" style="padding:5px 0;"><span style="display:inline-block;width:18px;height:18px;line-height:18px;border-radius:9px;background:#DBEAFE;color:${BRAND};font-size:11px;font-weight:800;text-align:center;">✓</span></td>
      <td style="padding:5px 0;font-family:${FONT};font-size:14px;color:${INK};">${f}</td>
    </tr>`).join('')

  const body = `
    <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:#DCFCE7;color:#166534;font-family:${FONT};font-size:11px;font-weight:800;letter-spacing:1px;">PAYMENT RECEIVED</span>
    <h1 style="margin:16px 0 12px;font-family:${FONT};font-size:28px;line-height:1.2;font-weight:800;color:${INK};">${heading}</h1>
    <p style="margin:0 0 24px;font-family:${FONT};font-size:16px;line-height:1.65;color:${MUTE};">${intro}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5FF;border:1px solid #DBEAFE;border-radius:14px;">
      <tr><td align="center" style="padding:22px 16px;">
        <div style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1.2px;color:${MUTE};">AMOUNT PAID</div>
        <div style="font-family:${FONT};font-size:40px;font-weight:800;color:${BRAND};letter-spacing:-1px;line-height:1.2;">${amount}</div>
        <div style="font-family:${FONT};font-size:13px;color:${MUTE};">on ${formatDate(d.paidAt)}</div>
      </td></tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;">
      ${detailRow('Plan', planLabel, true)}
      ${detailRow('Amount', amount)}
      ${method ? detailRow('Payment method', esc(method)) : ''}
      ${renews ? detailRow('Pro active until', renews) : ''}
      ${detailRow('Payment ID', `<span style="font-family:Consolas,Menlo,monospace;font-size:12.5px;">${esc(d.paymentId)}</span>`)}
      ${detailRow('Subscription ID', `<span style="font-family:Consolas,Menlo,monospace;font-size:12.5px;">${esc(d.subscriptionId)}</span>`)}
    </table>

    <h2 style="margin:28px 0 8px;font-family:${FONT};font-size:17px;font-weight:800;color:${INK};">What you've unlocked</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${features}</table>

    ${button('Open your dashboard', `${SITE}/app/dashboard`)}

    <p style="margin:20px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTE};">
      This is a one-${d.interval === 'annual' ? 'year' : 'month'} pass, so it won't renew automatically — you won't be charged again. When it ends, you can get Pro again any time from your dashboard.
      See our <a href="${SITE}/refund" style="color:${BRAND};">Refund &amp; Cancellation Policy</a>.
    </p>
    ${signOff()}`

  const text = [
    `Hi ${d.firstName},`, '',
    d.isRenewal ? 'Your JobEarly Pro subscription has renewed.' : "Thank you for subscribing — you're now on JobEarly Pro!", '',
    'PAYMENT RECEIPT',
    `Plan: ${planLabel}`,
    `Amount: ${amount}`,
    `Paid on: ${formatDate(d.paidAt)}`,
    ...(method ? [`Payment method: ${method}`] : []),
    ...(renews ? [`Pro active until: ${renews}`] : []),
    `Payment ID: ${d.paymentId}`,
    `Subscription ID: ${d.subscriptionId}`, '',
    `Open your dashboard: ${SITE}/app/dashboard`,
    `Cancel any time: ${SITE}/app/settings`, '',
    'Regards,', 'JobEarly team',
  ].join('\n')

  return {
    subject: d.isRenewal ? `Payment received: JobEarly Pro renewed (${amount})` : `Payment received — welcome to JobEarly Pro! (${amount})`,
    html: layout({ preheader: `We received your payment of ${amount}. You're on JobEarly Pro.`, body }),
    text,
  }
}

// ── New-subscriber notice (to the JobEarly team) ───────────────────────────
export function ownerNoticeEmail(d: ReceiptData & { customerName: string; customerEmail: string }): Email {
  const amount = formatRupees(d.amountRupees)
  const body = `
    <h1 style="margin:0 0 6px;font-family:${FONT};font-size:24px;font-weight:800;color:${INK};">${d.isRenewal ? '🔁 Pro renewal' : '💰 New Pro subscriber'}</h1>
    <p style="margin:0 0 18px;font-family:${FONT};font-size:15px;color:${MUTE};">${esc(d.customerName || 'A customer')} just paid <strong style="color:${INK};">${amount}</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${detailRow('Name', esc(d.customerName || '—'))}
      ${detailRow('Email', esc(d.customerEmail))}
      ${detailRow('Plan', d.interval === 'annual' ? 'One-year pass (₹1,188)' : 'One-month pass (₹199)')}
      ${detailRow('Amount', amount, true)}
      ${d.method ? detailRow('Method', esc(METHOD_LABELS[d.method] ?? d.method)) : ''}
      ${detailRow('Payment ID', esc(d.paymentId))}
      ${detailRow('Subscription ID', esc(d.subscriptionId))}
    </table>
    <p style="margin:20px 0 0;font-family:${FONT};font-size:13px;color:${MUTE};">Internal notification — the customer has been sent a receipt automatically.</p>`

  return {
    subject: `${d.isRenewal ? 'Renewal' : 'New Pro subscriber'}: ${d.customerEmail} · ${amount}`,
    html: layout({ preheader: `${d.customerEmail} paid ${amount}`, body }),
    text: `${d.isRenewal ? 'Renewal' : 'New Pro subscriber'}\nName: ${d.customerName}\nEmail: ${d.customerEmail}\nPlan: ${d.interval}\nAmount: ${amount}\nPayment ID: ${d.paymentId}\nSubscription ID: ${d.subscriptionId}`,
  }
}
