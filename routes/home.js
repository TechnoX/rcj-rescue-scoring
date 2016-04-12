// -*- tab-width: 2 -*-
var express = require('express')
var router = express.Router()


/* GET home page. */
router.get('/', function (req, res) {
  res.render('home');
})
router.get('/line/', function (req, res) {
  res.render('index');
})
router.get('/line/editor', function (req, res) {
  res.render('line_editor');
})
router.get('/line/judge', function (req, res) {
  res.render('line_judge');
})
router.get('/line/view', function (req, res) {
  res.render('line_view');
})



module.exports = router
