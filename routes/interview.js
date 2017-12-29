// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
const logger = require('../config/logger').mainLogger
var ObjectId = require('mongoose').Types.ObjectId
const auth = require('../helper/authLevels')
const ACCESSLEVELS = require('../models/user').ACCESSLEVELS

/* GET home page. */
publicRouter.get('/', function (req, res) {
  res.render('line_home', {user: req.user});
})

publicRouter.get('/:competitionid', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  res.render('interview', {id: id, user: req.user})
  //if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)) res.render('interview', {id: id, user: req.user})
  //else res.render('access_denied', {user: req.user})
})


privateRouter.get('/:competitionid/do/:teamid', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)) res.render('do_interview', {id: id, tid: tid, user: req.user})
  else res.render('access_denied', {user: req.user})
})

publicRouter.get('/:competitionid/view/:teamid', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  res.render('view_interview', {id: id, tid: tid, user: req.user})
  //if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)) res.render('view_interview', {id: id, tid: tid, user: req.user})
  //else res.render('access_denied', {user: req.user})
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
