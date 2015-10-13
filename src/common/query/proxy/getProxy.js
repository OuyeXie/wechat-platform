import redis from '../../db/redis'
import {redisConfig} from '../../constant'

export default async function () {
  let key = redisConfig.proxyList
  let ex = await redis.get(key)
  try {
    ex = JSON.parse(ex)
  } catch (e) {
    ex = null
  }
  return ex
}

