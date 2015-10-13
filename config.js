import _ from 'lodash'
import nconf from 'nconf'

nconf.file('./config.json')

let requiredKeys = (
  'mongodb redis pg sql-file').split(' ')

const conf = nconf.get()

let lost = _.difference(requiredKeys, Object.keys(conf))
if (lost.length) {
  throw new Error(`Require field ${lost.join(', ')} in config.json!`)
}

export default conf
