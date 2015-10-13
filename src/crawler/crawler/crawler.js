import Crawler from 'crawler'
import _ from 'lodash'

export default class {
  constructor(options) {
    this.crawler = new Crawler(options)
  }

  queue(options) {
    if (_.isString(options)) {
      options = {uri: options}
    } else if (!_.isObject(options)) {
      throw new Error('crawler options should be object')
    }
    return new Promise((resolve, reject) => {
      options.callback = (err, response, $) => {
        if (err) {
          reject(err)
        } else {
          if ($) {
            resolve({response, $})
          } else {
            resolve({response})
          }
        }
      }
      this.crawler.queue(options)
    })
  }
}

