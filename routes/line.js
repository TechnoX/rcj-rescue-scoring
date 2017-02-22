// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var ObjectId = require('mongoose').Types.ObjectId

/* GET home page. */
publicRouter.get('/', function (req, res) {
  res.render('line_home',{user: req.user});
})

publicRouter.get('/:competitionid', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('line_competition', {id : id , user: req.user})
})

publicRouter.get('/:competitionid/score', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('line_score', {id : id ,user: req.user})
})

publicRouter.get('/view/:roundid', function (req, res) {
  res.render('line_view', {id : req.params.roundid})
})
publicRouter.get('/viewfield/:fieldid', function (req, res) {
  res.render('line_view_field', {id : req.params.fieldid})
})
publicRouter.get('/viewcurrent', function (req, res) {
  res.render('line_view_current')
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
