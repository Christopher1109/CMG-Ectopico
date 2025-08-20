// Rate limiting simple para proteger las APIs
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(ip: string, maxRequests = 10, windowMs: number = 15 * 60 * 1000) {
  const now = Date.now()
  const userRequests = requestCounts.get(ip)

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (userRequests.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: userRequests.resetTime }
  }

  userRequests.count++
  return { allowed: true, remaining: maxRequests - userRequests.count }
}
