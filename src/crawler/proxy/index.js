import proxy from './proxy'

import setProxy from '../../common/query/proxy/setProxy'

export async function updateProxy() {
  console.info(`proxy list start`)
  try {
    let proxyList = await proxy()
    await setProxy(proxyList)
    console.info('proxy list finish')
  } catch (err) {
    console.error('proxy list error:', err, err)
  }
}