// -*- tab-width: 2 -*-
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const auth = require('../helper/authLevels')
const ObjectId = require('mongoose').Types.ObjectId
const ACCESSLEVELS = require('../models/user').ACCESSLEVELS


const logger = require('../config/logger').mainLogger

/* GET home page. */
privateRouter.get('/line_checkpoint/:runid', function (req, res, next) {
  const id = req.params.runid
  if (!ObjectId.isValid(id)) {
    return next()
  }
  //logger.debug(req)
  res.render('line_checkpoint', {id: id})
})

privateRouter.get('/:competitionid/line/apteam/:team', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.team
  res.render('line_apTeam',{id: id, user: req.user, tid: tid})
})

privateRouter.get('/:competitionid/maze/apteam/:team', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.team
  res.render('maze_apTeam',{id: id, user: req.user, tid: tid})
})


privateRouter.get('/:competitionid', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  if(auth.authCompetition(req.user,id,ACCESSLEVELS.VIEW)) res.render('kiosk_home', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})


privateRouter.get('/:competitionid/:roundid', function (req, res, next) {
  const id = req.params.competitionid;
  const round = req.params.roundid;

  if (!ObjectId.isValid(id)) {
    return next()
  }

  if(auth.authCompetition(req.user,id,ACCESSLEVELS.VIEW)) res.render('kiosk_home', {id: id, user: req.user, round: round})
  else res.render('access_denied', {user: req.user})
})


publicRouter.all('*', function (req, res, next) {
  next()
})


module.exports.public = publicRouter
module.exports.private = privateRouter

