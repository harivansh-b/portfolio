type RequestBody = { name?: unknown; message?: unknown }

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]!))

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })

  const key = process.env.BREVO_API_KEY
  const from = process.env.BREVO_MAIL_FROM_EMAIL
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL ?? from
  if (!key || !from || !recipient) return Response.json({ error: 'Email service is not configured.' }, { status: 503 })

  let body: RequestBody
  try { body = await request.json() as RequestBody } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : ''
  if (!name || !message) return Response.json({ error: 'Please provide your name and message.' }, { status: 400 })

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
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
  if (!response.ok) return Response.json({ error: 'Unable to send the message right now.' }, { status: 502 })
  return Response.json({ ok: true })
}
