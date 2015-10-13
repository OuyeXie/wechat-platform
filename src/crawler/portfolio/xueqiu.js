import _ from 'lodash'
import moment from 'moment'
import cheerio from 'cheerio'
import debug from 'debug'
import Crawler from '../proxy/proxyCrawler'

const crawler = new Crawler({
  rateLimits: 500,
  timeout: 10000,
  retries: 1,
  retryTimeout: 5000
})


const portfolioField = {
  annualized_gain_rate: 'annualizedGain',
  daily_gain: 'dailyGain',
  description: 'description',
  follower_count: 'followerCount',
  market: 'market',
  monthly_gain: 'monthlyGain',
  name: 'name',
  net_value: 'netValue',
  owner_id: 'userId',
  symbol: 'portfolioId',
  tag: 'tag',
  total_gain: 'gain'
}

const userField = {
  description: 'description',
  followers_count: 'followerCount',
  id: 'userId',
  screen_name: 'userName'
}

const rebalancingField = {
  id: 'rebId',
  rebalancing_id: 'listId',
  price: 'price',
  stock_name: 'stockName',
  stock_symbol: 'stockSymbol'
}


/**
 * 初始化 cookie
 */
async function updateCookie() {
  return await crawler.queue({
    uri: 'http://xueqiu.com/',
    jar: true,
    jQuery: false,
    proxy: undefined
  })
}


/**
 * 统一获取 response 的接口
 * @param {Object} options
 * @return {Object}: { response, $ }
 */
async function getData(options) {
  debug('xueqiu')('request:', options)

  // 必须使用 cookie
  let res = await crawler.queue(Object.assign({
    jar: true
  }, options))
  let body = res.response.body

  if (/系统检测到您的IP最近访问过于频繁，请输入验证码以继续访问/.test(body)) {
    // 要求输入验证码时更换代理
    crawler.proxyShift()
    return await getData(options)
  } else if (/遇到错误，请刷新页面或者重新登录帐号后再试/.test(body)) {
    // 需要更换 cookie
    await updateCookie()
    return await getData(options)
  }
  return res
}


/**
 * 获取 JSON 形式的接口
 * @param {Object} options
 * @return: json result
 */
async function getJson(options) {
  let res = await getData(options)
  try {
    return JSON.parse(res.response.body)
  } catch (e) {
    // JSON 解析错误时更换代理并重试
    crawler.proxyShift()
  }
  return await getJson(options)
}


/**
 * 获取一个 html 页面
 * @param {Object} options
 * @return {jQuery}
 */
async function getPage(options) {
  let res = await getData(options)
  return res.$
}


/*
 * 获取一页 portfolio 列表
 * @param {Object} qs
 * @return
 */
async function getListPage(qs) {
  return await getJson({
    uri: 'http://xueqiu.com/cubes/discover/rank/cube/list.json',
    qs: qs
  })
}


/*
 * 获取一页人气 portfolio 列表
 * @param {String} market: 'cn', 'hk' or 'us'
 * @param {Number} page
 * @return
 */
async function getHotListPage(market, page) {
  return await getListPage({
    market: market,
    category: 10,
    page: page,
    count: 100
  })
}


/*
 * 获取一页最赚钱 portfolio 列表
 * @param {String} market: 'cn', 'hk' or 'us'
 * @param {String} profit: 'monthly_gain', 'daily_gain' or 'annualized_gain_rate'
 * @param {Number} page
 * @return
 */
async function getMoneyListPage(market, profit, page) {
  return await getListPage({
    market: market,
    sale_flag: 0,
    stock_positions: 0,
    sort: 'best_benefit',
    category: 12,
    profit: profit,
    page: page,
    count: 100
  })
}


/*
 * 获取一类 portfolio 列表
 * @param {String} action: 'hot' or 'money'
 * @param {String} market: 'cn', 'hk' or 'us'
 * @param {String} profit: 'monthly_gain', 'daily_gain' or 'annualized_gain_rate'
 * @return
 */
async function getPortfolioList(action, market, profit) {
  async function getOnePage(page) {
    let res
    if (action === 'hot') {
      res = await getHotListPage(market, page)
    } else {
      res = await getMoneyListPage(market, profit, page)
    }
    return res
  }

  // 获取一页，获得总页数
  let res = await getOnePage(1)
  let list = res.list
  let maxPage = res.maxPage

  // 获取剩下的页面
  for (let page = 2; page <= maxPage; page++) {
    res = await getOnePage(page)
    list = list.concat(res.list)
  }
  return list
}


/*
 * 解析雪球组合 json
 */
function parsePortfolio(p) {
  let ret = _.mapKeys(_.pick(p, _.keys(portfolioField)), (v, k) => portfolioField[k])

  let owner = p.owner
  ret.user = _.mapKeys(_.pick(owner, _.keys(userField)), (v, k) => userField[k])

  if (ret.market) {
    ret.market = ret.market.toUpperCase()
  }

  ret.user.userImgUrl = owner.photo_domain + owner.profile_image_url.split(',')[0]
  ret.user.sourceLink = 'http://xueqiu.com/' + ret.user.userId
  ret.sourceLink = 'http://xueqiu.com/P/' + ret.portfolioId
  ret.source = 'xueqiu'

  return ret
}


/*
 * 获取全部在人气榜和赚钱榜上的 portfolio
 */
async function getPortfolios() {
  let ps = []
  const markets = ['cn', 'hk', 'us']
  const profits = ['monthly_gain', 'daily_gain', 'annualized_gain_rate']
  for (let market of markets) {
    ps = ps.concat(await getPortfolioList('hot', market))
    for (let profit of profits) {
      ps = ps.concat(await getPortfolioList('money', market, profit))
    }
  }
  ps = _.compact(ps)
  ps = _.uniq(ps, 'symbol')
  return ps.map(parsePortfolio)
}


/*
 * 获取一页调仓纪录
 * @param {String} portfolioId
 * @param {Number} page
 * @return
 */
async function getRebalancingPage(portfolioId, page) {
  return await getJson({
    uri: 'http://xueqiu.com/cubes/rebalancing/history.json',
    qs: {
      cube_symbol: portfolioId,
      count: 20,
      page: page
    }
  })
}


/*
 * 解析雪球调仓 json
 * @param {Object} rebalancing
 * @return {Object}
 */
function parseRebalancing(rebalancing) {
  let ret = []
  rebalancing.forEach(reb => {
    // 去除没有成功的调仓
    if (reb.status !== 'success') {
      return
    }

    reb.rebalancing_histories.forEach(r => {
      if (!r.price) {
        return
      }
      let e = _.mapKeys(_.pick(r, _.keys(rebalancingField)), (v, k) => rebalancingField[k])

      let prevWeight = r.prev_weight ? r.prev_weight : 0
      let targetWeight = r.target_weight ? r.target_weight : 0
      let weightChange = targetWeight - prevWeight
      e.prevWeight = prevWeight
      e.targetWeight = targetWeight
      e.weightChange = weightChange
      e.buy = weightChange > 0
      e.time = moment(r.created_at).toDate()
      e.cash = reb.cash

      ret.push(e)
    })
  })

  return ret
}


/*
 * 获取一个组合的全部调仓纪录
 * @param {String} portfolioId
 * @param {Number} maxPage: 最大获取页数，0 表示无限制
 * @return {Promise}
 */
async function getRebalancing(portfolioId, maxPage = 1) {
  if (maxPage === 0) {
    maxPage = 20
  }
  let list = []
  for (let page = 1; page <= maxPage; page++) {
    let res = await getRebalancingPage(portfolioId, page)
    list = list.concat(res.list)
    if (page >= res.maxPage) {
      break
    }
  }
  return parseRebalancing(list)
}


/*
 * 从组合页面中获取数据（胜率）
 * @param {String} portfolioId
 * @return
 */
async function getPortfolioPageInfo(portfolioId) {
  let $ = await getPage({
    uri: 'http://xueqiu.com/P/' + portfolioId
  })
  let res = {}
  let count = $('ul > li > span.count')
  let createDate = $('div.cube-createdate')

  if (count) {
    let total = parseInt(count.first().text(), 10)
    let win = parseInt(count.eq(1).text(), 10)
    let winrate = Math.round(win / total * 10000) / 100
    if (!isNaN(winrate)) {
      res.winrate = winrate
    }
  }

  if (createDate) {
    res.createTime = moment(createDate.text().split(' ')[1], 'YYYY.M.D').toDate()
  }

  return res
}


/*
 * 计算平均现金持有比率和调仓周期
 * @param {Object} rebalancing
 * @return {Object}: { avgCash, [rebPeriod] }
 */
function calcCashAndPeriod(rebalancing) {
  let ret = {}
  let sum = 0
  let totalPeriod = 0
  let endTime = Date.now()
  let rs = _.uniq(rebalancing, 'listId').sort((a, b) => b.time - a.time)

  rs.forEach(r => {
    let startTime = r.time.getTime()
    let period = endTime - startTime
    sum += r.cash * period
    totalPeriod += period
    endTime = startTime
  })
  ret.avgCash = Math.round(sum / totalPeriod * 100) / 100

  if (rs.length) {
    ret.rebPeriod = Math.round(moment().diff(rs[rs.length - 1].time, 'days') / rs.length * 100) / 100
  }

  return ret
}


/*
 * 获取全部组合信息
 * @return
 */
async function portfolio() {
  let ps = await getPortfolios()
  for (let p of ps) {
    let pid = p.portfolioId
    try {
      Object.assign(p, await getPortfolioPageInfo(pid))
      let rebalancing = await getRebalancing(pid, 1)
      Object.assign(p, calcCashAndPeriod(rebalancing))
      p.rebalancing = rebalancing
    } catch (err) {
      console.error('xueqiu portfolio info error:', err)
      p.rebalancing = []
    }
    p.source = 'xueqiu'
  }
  return ps
}


/*
 * 获取最近两页新闻
 * @param {Number} maxPage
 * @return
 */
async function recentNews(maxPage = 2) {
  let news = []
  let qs = ['.*', '.*?']
  let starLen = Math.floor(Math.random() * 20 + 5)
  let starReg = '.*?'
  for (let i = 0; i < starLen; i++) {
    starReg = starReg + '*'
  }
  qs.push(starReg)
  for (let q of qs) {
    for (let page = 1; page <= maxPage; page++) {
      let res = await getData({
        uri: 'http://xueqiu.com/k',
        qs: {
          q: q,
          sort: 'time',
          page: page,
          source: 'news'
        },
        jQuery: false
      })
      let body = res.response.body
      let m = body.match(/SNB\.data\.search\s*=\s*({.*?})\s*;/)
      news = news.concat(JSON.parse(m[1]).list)
    }
  }

  news = _.uniq(news, 'id')

  return news.map(n => {
    let $ = cheerio.load(n.text)
    let sourceLink = $('a').last().attr('href')
    return {
      newsId: n.id,
      title: n.title,
      summary: $('a').last().remove().end().text(),
      time: moment(n.created_at).toDate(),
      symbol: n.symbol_id,
      sourceLink: sourceLink,
      source: 'xueqiu'
    }
  })
}


async function stockList(country) {
  let type
  if (country === 'CN') {
    type = '11,12'
  } else if (country === 'HK') {
    type = '30'
  } else if (country === 'US') {
    type = '0,1,2,3'
  } else {
    throw new Error('country error')
  }

  async function getOnePage(page) {
    return await getJson({
      uri: 'http://xueqiu.com/stock/cata/stocklist.json',
      qs: {
        page: page,
        size: 100,
        order: 'asc',
        orderby: 'code',
        type: type
      }
    })
  }

  function parseStock(s) {
    return {
      symbol: s.symbol,
      code: s.symbol,
      name: s.name,
      country: country
    }
  }

  let res = await getOnePage(1)
  let maxPage = Math.ceil(res.count.count / 100)
  let stocks = res.stocks.map(parseStock)

  for (let page = 2; page <= maxPage; page++) {
    res = await getOnePage(page)
    stocks = stocks.concat(res.stocks.map(parseStock))
  }
  stocks = stocks.filter(s => s.symbol)
  stocks = _.uniq(stocks, 'symbol')
  return stocks
}

async function followerCount(symbol) {
  let res = await getJson({
    uri: 'http://xueqiu.com/recommend/pofriends.json',
    qs: {
      type: 1,
      code: symbol,
      start: 0,
      count: 0
    }
  })
  return res.totalcount
}

export default {
  portfolio,
  recentNews,
  stockList,
  followerCount
}

