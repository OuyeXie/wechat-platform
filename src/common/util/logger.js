import winston from 'winston'
import moment from 'moment'

const level = ['production', 'prerelease'].indexOf(process.env.NODE_ENV) >= 0 ? 'info' : 'info'
const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level,
      timestamp: () => moment().format('YYYY-MM-DD hh:mm:ss.SSS')
    })
  ]
})

const consoleLog = console.log

logger.extend(console)

console.log = (...args) => {
  args.unshift(`${moment().format('YYYY-MM-DD hh:mm:ss.SSS')} - log:`)
  consoleLog.apply(console, args)
}

export default logger
