app.use('/users', users);
app.use('/weixin', weixin);
app.use(express.query()); // Or app.use(express.query());
app.use('/wechat', wechat('hchismylove', function (req, res, next) {
  // 微信输入信息都在req.weixin上
  var message = req.weixin;
  console.log(message);
  if((message.MsgType == 'event') && (message.Event == 'subscribe'))
  {
    var refillStr = "<a href=\"http://your_IP/weixin/refill?weixinId=" + message.FromUserName + "\">1. 点击记录团队充值</a>"

    var consumeStr = "<a href=\"http://your_IP/weixin/consume?weixinId=" + message.FromUserName + "\">2. 点击记录团队消费</a>"
    var deleteStr = "<a href=\"http://your_IP/weixin/delete?weixinId=" + message.FromUserName + "\">3. 点击回退记录</a>"
    var historyStr = "<a href=\"http://your_IP/weixin/history?weixinId=" + message.FromUserName + "\">4. 点击查询历史记录</a>"

    var emptyStr = "          ";
    var replyStr = "感谢你的关注！" + "\n"+ emptyStr + "\n" + refillStr + "\n"+ emptyStr + "\n" + consumeStr
        + "\n"+ emptyStr + "\n" + deleteStr + "\n"+ emptyStr + "\n" + historyStr;
    res.reply(replyStr);
  }
}));