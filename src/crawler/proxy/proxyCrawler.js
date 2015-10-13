import Crawler from '../crawler/crawler'
import _ from 'lodash'
import Debug from 'debug'
import getProxy from '../../common/query/proxy/getProxy'

const debug = Debug('proxy')
const ERROR_PATTERN = /<!DOCTYPE HTML PUBLIC "-\/\/W3C\/\/DTD HTML 4\.01 Transitional\/\/EN" "http:\/\/www\.w3\.org\/TR\/html4\/loose\.dtd">/


export default class {
  constructor(options) {
    this.proxyList = []
    this.crawler = new Crawler(Object.assign({
      timeout: 20000,
      retries: 1,
      retryTimeout: 10000
    }, options))
  }

  proxyShift() {
    this.proxyList = this.proxyList.filter(p => p !== this.prevProxy)
  }

  async queue(options) {
    if (_.isString(options)) {
      options = {uri: options}
    }
    for (let retry = 0; retry < 20; retry++) {
      const proxy = await this._getProxy()
      try {
        const res = await this.crawler.queue(Object.assign({proxy}, options))
        if (!ERROR_PATTERN.test(res.response.body)) {
          this.prevProxy = proxy
          return res
        }
      } catch (err) {
        debug('proxy error', err)
      }
      this.proxyList = this.proxyList.filter(p => p !== proxy)
    }
    throw new Error('proxy request fail')
  }

  async _getProxy() {
    if (!this.proxyList.length) {
      const list = await getProxy()
      this.proxyList = list.filter(p => p.delay < 2000)
        .slice(0, 100)
        .map(p => p.url)
    }
    return this.proxyList[_.random(this.proxyList.length - 1)]
  }
}

