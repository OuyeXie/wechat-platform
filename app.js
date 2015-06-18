var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var wechat = require("wechat");

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

//app.use('/weixin', weixin);

app.use(express.query()); // Or app.use(express.query());
app.use('/wechat', wechat('ouyexiewechattoken', function (req, res, next) {
  var message = req.weixin;
  console.log(message);
  if((message.MsgType == 'event') && (message.Event == 'subscribe'))
  {
    var _you = "<a href=\"http://your_IP/weixin/you?weixinId=" + message.FromUserName + "\">you</a>"
    var _cannot = "<a href=\"http://your_IP/weixin/cannot?weixinId=" + message.FromUserName + "\">cannot</a>"
    var _do = "<a href=\"http://your_IP/weixin/do?weixinId=" + message.FromUserName + "\">do</a>"
    var _anything = "<a href=\"http://your_IP/weixin/anything?weixinId=" + message.FromUserName + "\">anything</a>"
    var _for = "<a href=\"http://your_IP/weixin/for?weixinId=" + message.FromUserName + "\">for</a>"
    var _now = "<a href=\"http://your_IP/weixin/now?weixinId=" + message.FromUserName + "\">now</a>"

    var _emptyStr = "          ";
    var replyStr = "Thanks for following！" + "\n"+ emptyStr + "\n" + _you + "\n"+ emptyStr + "\n" + _cannot
        + "\n"+ _do + "\n" + _anything + "\n"+ emptyStr + "\n" + _for + "\n" + _now;
    res.reply(replyStr);
  }
}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
