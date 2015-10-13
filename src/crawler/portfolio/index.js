import uuid from 'node-uuid'

import xueqiu from './xueqiu'

export async function updateXueqiuPortfolio() {
  const id = uuid.v4()
  console.info(`Xueqiu portfolio crawler #${id} start`)
  try {
    let p = await xueqiu.portfolio()
    console.log(p)
    console.info(`Xueqiu portfolio crawler #${id} finish`)
  } catch (err) {
    console.error(`Xueqiu portfolio crawler #${id} error:`, err)
  }
}