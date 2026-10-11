type VercelRequest = { method?: string }
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void }

/* Visitor counter backed by Upstash Redis (REST API, no SDK).
   Works with either the Upstash env names or the ones Vercel's Upstash/KV integration injects. */
const KEY = 'portfolio:visits'

export default async function handler(request: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) return res.status(503).json({ error: 'Visitor counter is not configured.' })

  const command = request.method === 'POST' ? 'incr' : request.method === 'GET' ? 'get' : null
  if (!command) return res.status(405).json({ error: 'Method not allowed' })

  try {
    const upstream = await fetch(`${url.replace(/\/$/, '')}/${command}/${KEY}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!upstream.ok) throw new Error(`Upstash responded ${upstream.status}`)
    const data = await upstream.json() as { result: number | string | null }
    return res.status(200).json({ visits: Number(data.result ?? 0) })
  } catch {
    return res.status(502).json({ error: 'Visitor counter unavailable.' })
  }
}
