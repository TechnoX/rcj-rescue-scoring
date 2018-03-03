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
privateRouter.get('/:competitionid', function (req, res) {
  const id = req.params.competitionid
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.VIEW)) res.render('main_signage', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

privateRouter.get('/:competitionid/run', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.VIEW)) res.render('runs_monitor', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

publicRouter.get('/:competitionid/score/Maze', function (req, res, next) {
    const id = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }

    res.render('maze_score_signage', {
        id: id,
        get: req.query,
        user: req.user
    })
})

publicRouter.get('/:competitionid/score/:league', function (req, res, next) {
  const id = req.params.competitionid
  const league = req.params.league
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  res.render('line_score_signage', {id: id, user: req.user, get: req.query, league: league})
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
