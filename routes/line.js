// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
const logger = require('../config/logger').mainLogger
var ObjectId = require('mongoose').Types.ObjectId
const auth = require('../helper/authLevels')
const ruleDetector = require('../helper/ruleDetector')
const ACCESSLEVELS = require('../models/user').ACCESSLEVELS
const competitiondb = require('../models/competition')
const LEAGUES = competitiondb.LEAGUES

/* GET home page. */

publicRouter.get('/:competitionid', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)) res.render('line_competition', {id: id, user: req.user, judge: 1})
  else res.render('line_competition', {id: id, user: req.user, judge: 0})
})

publicRouter.get('/:competitionid/score/:league', function (req, res, next) {
  const id = req.params.competitionid;
  const league = req.params.league;

  if (!ObjectId.isValid(id)) {
    return next()
  }
  if (LEAGUES.filter(function (elm){
    return elm == league;
  }).length == 0){
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
      res.render('line_score', {id: id, user: req.user,league: league,num: num, get: req.query})
    }
  })


})


publicRouter.get('/view/:runid', async function (req, res, next) {
  const id = req.params.runid

  if (!ObjectId.isValid(id)) {
    return next()
  }
  let rule = await ruleDetector.getRuleFromLineRunId(id);
  res.render('line_view', {id: id,user: req.user,rule: rule})
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


privateRouter.get('/judge/:runid', async function (req, res, next) {
  const id = req.params.runid
  if (!ObjectId.isValid(id)) {
    return next()
  }

  let rule = await ruleDetector.getRuleFromLineRunId(id);
  res.render('line_judge', {id: id, rule: rule})
})

privateRouter.get('/sign/:runid', async function (req, res) {
  const id = req.params.runid
  if (!ObjectId.isValid(id)) {
    return next()
  }

  let rule = await ruleDetector.getRuleFromLineRunId(id);
  res.render('line_sign', {id: id, rule: rule})
})

adminRouter.get('/approval/:runid', async function (req, res) {
  const id = req.params.runid
  if (!ObjectId.isValid(id)) {
    return next()
  }

  let rule = await ruleDetector.getRuleFromLineRunId(id);
  res.render('line_approval', {id: id, rule: rule})
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
