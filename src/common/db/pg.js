import pgp from 'pg-promise'
import debug from 'debug'
import config from '../../../config'


const db = pgp({
  query: (e)=> {
    debug('postgresql')('[Query] ', e.query)
  }
})(config.pg)

export default db
