import redis from '../../db/redis'
import {redisConfig} from '../../constant'

export default async function(proxyList) {
  if (!proxyList) {
    throw new Error('no proxy list')
  }
  return await redis.set(redisConfig.proxyList, JSON.stringify(proxyList))
}

