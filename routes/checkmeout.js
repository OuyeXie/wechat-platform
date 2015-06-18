var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('checkmeout', { wechatId: req.param('wechatId') });
});

module.exports = router;
