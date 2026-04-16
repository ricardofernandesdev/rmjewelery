import { NextResponse, type NextRequest } from 'next/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60

const buckets = new Map<string, number[]>()

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

export function middleware(req: NextRequest) {
  const ip = getClientIp(req)
  const now = Date.now()
  const cutoff = now - WINDOW_MS

  const timestamps = (buckets.get(ip) ?? []).filter((t) => t > cutoff)

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0]!
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000)
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, retryAfter)),
        },
      },
    )
  }

  timestamps.push(now)
  buckets.set(ip, timestamps)

  // Light cleanup to keep memory bounded
  if (buckets.size > 5000) {
    for (const [key, value] of buckets) {
      if (value[value.length - 1]! < cutoff) buckets.delete(key)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/products/by-category'],
}
