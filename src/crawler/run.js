import {updateProxy} from './proxy'
import {updateXueqiuPortfolio} from './portfolio'
import logger from '../common/util/logger' // eslint-disable-line  no-unused-vars

(async () => {
  await updateProxy()
  //await updateXueqiuPortfolio()
})()
