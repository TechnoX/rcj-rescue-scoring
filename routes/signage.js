// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
const logger = require('../config/logger').mainLogger
var ObjectId = require('mongoose').Types.ObjectId
const auth = require('../helper/authLevels')
const competitiondb = require('../models/competition')
const ACCESSLEVELS = require('../models/user').ACCESSLEVELS

/* GET home page. */

adminRouter.get('/setting', function (req, res) {
  res.render('signage_setting', {user: req.user})
})

adminRouter.get('/setting/editor', function (req, res) {
  res.render('signage_editor', {user: req.user})
})

adminRouter.get('/setting/editor/:id', function (req, res){
  const id = req.params.id
  res.render('signage_editor', {user: req.user , id: id})
})


privateRouter.get('/display/:competitionid/run', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.VIEW)) res.render('runs_monitor', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

privateRouter.get('/display/:sigId/:group', function (req, res) {
  const sigId = req.params.sigId
  const group = req.params.group
  
  res.render('main_signage', {user: req.user, sigId: sigId,group: group})
})

privateRouter.get('/display/:competitionid/run/:sigId', function (req, res, next) {
  const id = req.params.competitionid
  const sigId = req.params.sigId
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.VIEW)) res.render('runs_monitor', {id: id, user: req.user,sigId: sigId})
  else res.render('access_denied', {user: req.user})
})

privateRouter.get('/display/:competitionid/score/Maze', function (req, res, next) {
    const id = req.params.competitionid
    const league = 'Maze';

    if (!ObjectId.isValid(id)) {
        return next()
    }

    competitiondb.competition.findOne({
      _id: id,
    }).lean().exec(function (err, data) {
      if (err) {
        logger.error(err)
        res.status(400).send({
          msg: "Could not get competition",
          err: err.message
        })
      } else {
        let num = 20;
        for(let i in data.ranking){
          if(data.ranking[i].league == 'Maze'){
            num = data.ranking[i].num;
            break;
          }
        }
        res.render('maze_score_signage', {id: id, user: req.user,league: league,num: num, get: req.query})
      }
    })
})

privateRouter.get('/display/:competitionid/score/:league', function (req, res, next) {
  const id = req.params.competitionid
  const league = req.params.league
  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.competition.findOne({
    _id: id,
  }).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get competition",
        err: err.message
      })
    } else {
      let num = 20;
      for(let i in data.ranking){
        if(data.ranking[i].league == league){
          num = data.ranking[i].num;
          break;
        }
      }
      res.render('line_score_signage', {id: id, user: req.user,league: league,num: num, get: req.query})
    }
  })
})

privateRouter.get('/display/:competitionid/timetable/:league/:round', function (req, res, next) {
  const id = req.params.competitionid
  const league = req.params.league
  const round = req.params.round
  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('signage_timetable', {id: id, user: req.user, league: league, round: round})
})


module.exports.public = publicRouter
module.exports.private = privateRouter
module.exports.admin = adminRouter
