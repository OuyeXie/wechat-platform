import config from '../../../config'
import debug from 'debug'
import mongodb from 'mongodb'


let db = null
const conStr = `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}`
debug('mongodb')('mongodb connect:', conStr)
const conPrm = mongodb.MongoClient.connect(conStr).then(_db => {
  debug('mongodb')('mongodb connected')
  db = _db
  return db
})


function connect() {
  return conPrm
}


export default {
  connect,
  mongodb
}
