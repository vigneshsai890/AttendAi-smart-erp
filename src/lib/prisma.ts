import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
        : ['warn', 'error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Log slow queries in dev (> 500ms)
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(prisma as any).$on('query', (e: { duration: number; query: string }) => {
    if (e.duration > 500) {
      console.warn(`[SLOW QUERY] ${e.duration}ms — ${e.query.slice(0, 100)}`)
    }
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
