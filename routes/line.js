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

publicRouter.get('/:competitionid', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)) res.render('line_competition', {id: id, user: req.user, judge: 1})
  else res.render('line_competition', {id: id, user: req.user, judge: 0})
})

publicRouter.get('/:competitionid/score', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  res.render('line_score', {id: id, user: req.user, get: req.query})
})


publicRouter.get('/view/:runid', function (req, res, next) {
  const id = req.params.runid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  res.render('line_view', {id: id})
})


publicRouter.get('/view/field/:competitionid/:fieldid', function (req, res) {
    const id = req.params.fieldid
    const cid = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    res.render('line_view_field', {
        id: id,
        cid: cid
    })
})


publicRouter.get('/viewcurrent', function (req, res) {
  res.render('line_view_current')
})

privateRouter.get('/judge/:runid', function (req, res, next) {
  const id = req.params.runid
  if (!ObjectId.isValid(id)) {
    return next()
  }
  //logger.debug(req)
  res.render('line_judge', {id: id})
})

privateRouter.get('/sign/:runid', function (req, res) {
  res.render('line_sign', {id: req.params.runid})
})

adminRouter.get('/approval/:runid', function (req, res) {
  const id = req.params.runid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  res.render('line_approval', {id: id})
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
