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
router.get('/line/editor/:mapid', function (req, res) {
  res.render('line_editor', {id : req.params.mapid})
})
router.get('/line/editor/', function (req, res) {
  res.render('line_editor')
})
router.get('/line/judge/:roundid', function (req, res) {
  res.render('line_judge', {id : req.params.roundid})
})
router.get('/line/view/:roundid', function (req, res) {
  res.render('line_view', {id : req.params.roundid})
})



module.exports = router
