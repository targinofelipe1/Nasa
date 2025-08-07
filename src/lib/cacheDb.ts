import { Redis } from '@upstash/redis'

export const cacheDb = Redis.fromEnv()