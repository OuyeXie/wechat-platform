import _ from 'lodash'
import requestCb from 'request'
import Crawler from '../crawler/crawler'
import getProxy from '../../common/query/proxy/getProxy'

const crawler = new Crawler({
  rateLimits: 100,
  retries: 1,
  timeout: 5000
})


function request(options) {
  return new Promise((resolve, reject) => {
    requestCb(options, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}


async function getProxyFromCz88() {
  const proxys = []
  const sites = [
    'http://www.cz88.net/proxy',
    'http://www.cz88.net/proxy/http_2.shtml'
  ]
  let $

  function extractProxy(i, elem) {
    // first line is not useful (column titles)
    if (!i) {
      return
    }
    let ip = $(elem).find('.ip').text()
    let port = $(elem).find('.port').text()
    proxys.push(`http://${ip}:${port}`)
  }

  for (let site of sites) {
    try {
      console.info('get proxy from site: ' + site)
      let res = await crawler.queue(site)
      $ = res.$
      $('#boxright li').each(extractProxy)
    } catch (err) {
      console.error('proxy error:', err)
    }
  }

  return proxys
}

// have to use VPN
async function getProxyFromProxyRu() {
  const proxys = []
  const sites = [
    'http://www.proxy.com.ru/list_1.html',
    'http://www.proxy.com.ru/list_2html'
  ]
  let $

  function extractProxy(i, elem) {
    if (!i) {
      return
    }
    let ip = ''
    let port = ''
    $(elem).find('td').each((j, jelem) => {
      if (j === 1) {
        ip = $(jelem).text()
      }
      if (j === 2) {
        port = $(jelem).text()
      }
    })
    if (ip && port) {
      proxys.push(`http://${ip}:${port}`)
    }
  }

  for (let site of sites) {
    try {
      console.info('get proxy from site: ' + site)
      let res = await crawler.queue(site)
      $ = res.$
      $($('table').get(7)).find('tr').each(extractProxy)
    } catch (err) {
      console.error('proxy error:', err)
    }
  }
  return proxys
}


async function testProxy(proxy) {
  let startTime = new Date()
  try {
    await request({
      uri: 'http://1111.ip138.com/ic.asp',
      proxy: proxy,
      timeout: 5000
    })
    let delay = new Date() - startTime
    console.debug('proxy delay:', proxy, delay)
    return {
      url: proxy,
      delay: delay
    }
  } catch (err) {
    console.debug('proxy error:', proxy, err)
  }
}


export default async function() {
  let proxyList = await getProxyFromCz88()
  console.info('current number of proxies: ' + proxyList.length)
  proxyList = proxyList.concat(await getProxyFromProxyRu())
  console.info('current number of proxies: ' + proxyList.length)
  console.info('uniq')
  proxyList = _.uniq(proxyList)
  console.info('current number of proxies: ' + proxyList.length)
  console.info('put old proxies retrieved from redis')
  let ex = await getProxy()
  if (ex) {
    let proxySet = new Set(proxyList.map(p => {
      return p.url
    }))
    for (let e of ex) {
      if (!proxySet.has(e.url)) {
        proxyList.push(e)
      }
    }
  }
  console.info('current number of proxies: ' + proxyList.length)
  console.info('test')
  proxyList = await * proxyList.map(testProxy)
  console.info('current number of proxies: ' + proxyList.length)
  console.info('compact')
  proxyList = _.compact(proxyList)
  console.info('current number of proxies: ' + proxyList.length)
  console.info('slice')
  proxyList = proxyList.slice(0, 1000)
  console.info('current number of proxies: ' + proxyList.length)
  return proxyList
}

