import { Client } from '@upstash/qstash'

export const jobs = new Client({
  token: process.env.QSTASH_TOKEN
})