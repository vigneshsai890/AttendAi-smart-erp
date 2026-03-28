/**
 * Sliding-window rate limiter — in-process (no Redis needed).
 * Keyed on a string (e.g. userId or IP).
 *
 * Usage:
 *   const { allowed, remaining } = checkRateLimit("mark:" + userId, 5, 60_000)
 *   if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
 */

interface Window {
  timestamps: number[]
}

const store = new Map<string, Window>()

// Clean up stale keys every 5 minutes to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, win] of store.entries()) {
    // Remove windows with no recent activity
    if (win.timestamps.length === 0 || now - win.timestamps[win.timestamps.length - 1] > 5 * 60_000) {
      store.delete(key)
    }
  }
}, 5 * 60_000)

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  const cutoff = now - windowMs

  let win = store.get(key)
  if (!win) {
    win = { timestamps: [] }
    store.set(key, win)
  }

  // Drop timestamps outside the window
  win.timestamps = win.timestamps.filter((t) => t > cutoff)

  if (win.timestamps.length >= maxRequests) {
    const resetMs = win.timestamps[0] + windowMs - now
    return { allowed: false, remaining: 0, resetMs }
  }

  win.timestamps.push(now)
  return {
    allowed: true,
    remaining: maxRequests - win.timestamps.length,
    resetMs: 0,
  }
}
