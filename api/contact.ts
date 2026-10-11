type RequestBody = { name?: unknown; email?: unknown; phone?: unknown; message?: unknown }
type VercelRequest = { method?: string; body?: RequestBody }
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void }

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!))

function buildHtmlEmail(name: string, email: string, phone: string, message: string): string {
  const safeMsg = escapeHtml(message).replace(/\n/g, '<br>')
  const hasEmail = email.length > 0
  const hasPhone = phone.length > 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Portfolio Transmission</title>
</head>
<body style="margin:0;padding:0;background:#030612;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#030612;min-height:100vh;">
  <tr>
    <td align="center" style="padding:48px 16px;">
      <table role="presentation" width="100%" style="max-width:600px;background:linear-gradient(140deg,#0d1535,#07101f);border:1px solid rgba(140,180,255,0.22);border-radius:4px;overflow:hidden;">

        <!-- Header bar -->
        <tr>
          <td style="background:linear-gradient(90deg,#0a1a3a,#101d40);padding:0 28px;border-bottom:1px solid rgba(140,180,255,0.18);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:16px 0;">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;border:1px solid #9fe5ff;box-shadow:0 0 10px #6be0ff;background:transparent;margin-right:10px;vertical-align:middle;"></span>
                  <span style="font-size:11px;letter-spacing:0.18em;color:#9ee6ff;font-family:'Courier New',monospace;vertical-align:middle;">HB · MISSION_01</span>
                </td>
                <td align="right" style="padding:16px 0;">
                  <span style="font-size:9px;letter-spacing:0.14em;color:#4a6a90;font-family:'Courier New',monospace;">SYS / ONLINE</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Tag line -->
        <tr>
          <td style="padding:32px 28px 0;">
            <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.2em;color:#9ee6ff;font-family:'Courier New',monospace;">INCOMING TRANSMISSION / PORTFOLIO</p>
            <h1 style="margin:0 0 6px;font-size:36px;font-weight:700;letter-spacing:-0.06em;color:#edf4ff;line-height:1.1;">New Message</h1>
            <p style="margin:0;font-size:13px;color:#6a8ab0;letter-spacing:0.04em;">Someone reached out through your portfolio contact form.</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:22px 28px 0;">
            <div style="height:1px;background:linear-gradient(90deg,#9ee6ff40,#3a5a8040);"></div>
          </td>
        </tr>

        <!-- Sender block -->
        <tr>
          <td style="padding:24px 28px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(10,25,60,0.6);border:1px solid rgba(80,130,200,0.25);border-radius:3px;">
              <tr>
                <td style="padding:8px 14px;border-bottom:1px solid rgba(80,130,200,0.18);">
                  <span style="font-size:9px;letter-spacing:0.18em;color:#5a80b0;font-family:'Courier New',monospace;">SENDER MANIFEST</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 14px;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:10px;">
                        <span style="font-size:9px;letter-spacing:0.14em;color:#4a7090;font-family:'Courier New',monospace;display:block;margin-bottom:3px;">NAME</span>
                        <span style="font-size:18px;font-weight:600;color:#d8eeff;letter-spacing:-0.02em;">${escapeHtml(name)}</span>
                      </td>
                    </tr>
                    ${hasEmail ? `
                    <tr>
                      <td style="padding-bottom:8px;">
                        <span style="font-size:9px;letter-spacing:0.14em;color:#4a7090;font-family:'Courier New',monospace;display:block;margin-bottom:3px;">EMAIL</span>
                        <a href="mailto:${escapeHtml(email)}" style="font-size:14px;color:#9ee6ff;text-decoration:none;letter-spacing:0.02em;">${escapeHtml(email)}</a>
                      </td>
                    </tr>` : ''}
                    ${hasPhone ? `
                    <tr>
                      <td>
                        <span style="font-size:9px;letter-spacing:0.14em;color:#4a7090;font-family:'Courier New',monospace;display:block;margin-bottom:3px;">PHONE</span>
                        <a href="tel:${escapeHtml(phone)}" style="font-size:14px;color:#9ee6ff;text-decoration:none;letter-spacing:0.02em;">${escapeHtml(phone)}</a>
                      </td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Message block -->
        <tr>
          <td style="padding:20px 28px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(6,15,40,0.7);border:1px solid rgba(80,130,200,0.22);border-radius:3px;">
              <tr>
                <td style="padding:8px 14px;border-bottom:1px solid rgba(80,130,200,0.18);">
                  <span style="font-size:9px;letter-spacing:0.18em;color:#5a80b0;font-family:'Courier New',monospace;">TRANSMISSION CONTENT</span>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 14px;">
                  <p style="margin:0;font-size:15px;line-height:1.7;color:#b8cce0;">${safeMsg}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Reply CTA -->
        ${hasEmail ? `
        <tr>
          <td style="padding:22px 28px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#0d4d87,#0a3a68);border-radius:2px;">
                  <a href="mailto:${escapeHtml(email)}" style="display:inline-block;padding:12px 20px;font-size:10px;letter-spacing:0.14em;color:#e8f5ff;text-decoration:none;font-family:'Courier New',monospace;">REPLY TO ${escapeHtml(name.toUpperCase())} ↗</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ''}

        <!-- Divider -->
        <tr>
          <td style="padding:28px 28px 0;">
            <div style="height:1px;background:linear-gradient(90deg,#3a5a8040,#9ee6ff40,#3a5a8040);"></div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 28px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:9px;letter-spacing:0.16em;color:#2a4060;font-family:'Courier New',monospace;">HB / PORTFOLIO · 2026</span>
                </td>
                <td align="right">
                  <span style="font-size:9px;letter-spacing:0.12em;color:#2a4060;font-family:'Courier New',monospace;">THE JOURNEY CONTINUES</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export default async function handler(request: VercelRequest, res: VercelResponse) {
  if (request.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = process.env.BREVO_API_KEY
  const from = process.env.BREVO_MAIL_FROM_EMAIL ?? process.env.BREVO_SENDER_EMAIL
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL ?? from
  if (!key || !from || !recipient) return res.status(503).json({ error: 'Email service is not configured.' })

  const body = request.body
  if (!body) return res.status(400).json({ error: 'Invalid request.' })

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : ''
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : ''

  if (!name || !message) return res.status(400).json({ error: 'Please provide your name and message.' })

  const replyTo = email
    ? { email, name }
    : { email: from, name }

  const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': key },
    body: JSON.stringify({
      sender: { name: 'Harivansh B Portfolio', email: from },
      to: [{ email: recipient, name: 'Harivansh B' }],
      replyTo,
      subject: `Portfolio transmission from ${name}`,
      htmlContent: buildHtmlEmail(name, email, phone, message),
      textContent: `INCOMING TRANSMISSION / PORTFOLIO\n\nFrom: ${name}${email ? `\nEmail: ${email}` : ''}${phone ? `\nPhone: ${phone}` : ''}\n\n${message}`,
      tags: ['portfolio-contact'],
    }),
  })

  if (!brevoResponse.ok) return res.status(502).json({ error: 'Unable to send the message right now.' })
  return res.status(200).json({ ok: true })
}
