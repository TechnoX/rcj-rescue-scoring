// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var ObjectId = require('mongoose').Types.ObjectId

/* GET home page. */
publicRouter.get('/', function (req, res) {
  res.render('maze_home');
})
adminRouter.get('/editor', function (req, res) {
  res.render('maze_editor')
})
adminRouter.get('/editor/:mapid', function (req, res, next) {
  const id = req.params.mapid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('maze_editor', {mapid : id})
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
