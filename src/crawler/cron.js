import _ from 'lodash'
import {CronJob} from 'cron'

import {updateXueqiuPortfolio} from './portfolio'
import {updateProxy} from './proxy'

function cron(settings) {
  return _.mapValues(settings, setting => {
    return new CronJob(setting.cronTime, setting.onTick, null, true)
  })
}


const setting = {
  // update proxy url
  proxy: {
    cronTime: '0 */30 * * * *',
    onTick: updateProxy
  },
  xueqiuPortfolio: {
    cronTime: '0 0 * * * *',
    onTick: updateXueqiuPortfolio
  }
}


cron(setting)

