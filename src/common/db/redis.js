import config from '../../../config'
import redis from 'then-redis'
const db = redis.createClient(config.redis)
export default db

