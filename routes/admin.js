// -*- tab-width: 2 -*-
var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function (req, res) {
  res.render('admin_home')
})

router.get('/team', function (req, res) {
  res.render('team_admin')
})

router.get('/run', function (req, res) {
  res.render('run_admin')
})

module.exports = router
