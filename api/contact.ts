type RequestBody = { name?: unknown; message?: unknown }
type VercelRequest = { method?: string; body?: RequestBody }
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void }

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!))

export default async function handler(request: VercelRequest, res: VercelResponse) {
  if (request.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = process.env.BREVO_API_KEY
  const from = process.env.BREVO_MAIL_FROM_EMAIL
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL ?? from
  if (!key || !from || !recipient) return res.status(503).json({ error: 'Email service is not configured.' })

  const body = request.body
  if (!body) return res.status(400).json({ error: 'Invalid request.' })
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : ''
  if (!name || !message) return res.status(400).json({ error: 'Please provide your name and message.' })

  const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': key },
    body: JSON.stringify({
      sender: { name: 'Harivansh B Portfolio', email: from },
      to: [{ email: recipient, name: 'Harivansh B' }],
      replyTo: { email: from, name: name },
      subject: `Portfolio message from ${name}`,
      htmlContent: `<h2>New portfolio transmission</h2><p><strong>From:</strong> ${escapeHtml(name)}</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      textContent: `New portfolio transmission\n\nFrom: ${name}\n\n${message}`,
      tags: ['portfolio-contact'],
    }),
  })
  if (!brevoResponse.ok) return res.status(502).json({ error: 'Unable to send the message right now.' })
  return res.status(200).json({ ok: true })
}
