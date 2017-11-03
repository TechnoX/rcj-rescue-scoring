// -*- tab-width: 2 -*-
var express = require('express')
var router = express.Router()


/* GET home page. */
router.get('/', function (req, res) {
  res.render('home', {user: req.user});
})

router.get('/access_denied', function (req, res) {
  res.render('access_denied', {user: req.user});
})

module.exports = router
