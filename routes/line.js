// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()


/* GET home page. */
publicRouter.get('/', function (req, res) {
  res.render('line_home');
})

publicRouter.get('/view/:roundid', function (req, res) {
  res.render('line_view', {id : req.params.roundid})
})

privateRouter.get('/judge/:roundid', function (req, res) {
  res.render('line_judge', {id : req.params.roundid})
})

adminRouter.get('/editor', function (req, res) {
  res.render('line_editor')
})
adminRouter.get('/editor/:mapid', function (req, res) {
  res.render('line_editor', {id : req.params.mapid})
})

publicRouter.all('*', function (req, res, next) {
  next()
})
privateRouter.all('*', function (req, res, next) {
  next()
})

module.exports.public = publicRouter
module.exports.private = privateRouter
module.exports.admin = adminRouter
