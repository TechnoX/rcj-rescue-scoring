//========================================================================
//                          Libraries
//========================================================================

var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var competitiondb = require('../../models/competition')
var teamdb = require('../../models/team')
var rundb = require('../../models/run')
var query = require('../../helper/query-helper')
var leagues = require('../../leagues')
var validator = require('validator')
var async = require('async')
var ObjectId = require('mongoose').Types.ObjectId
var logger = require('../../config/logger').mainLogger
var fs = require('fs')


publicRouter.get('/', function (req, res) {
  query.doFindResultSortQuery(req, res, null, null, teamdb.team)
})

publicRouter.get('/leagues', function (req, res) {
  res.send(leagues.names)
})

publicRouter.get('/:teamid', function (req, res, next) {
  var id = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  query.doIdQuery(req, res, id, "", teamdb.team)
})

publicRouter.get('/:teamid/runs', function (req, res, next) {
  var id = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  rundb.run.find({team: id}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get runs", err: err.message})
    } else {
      res.status(200).send(data)
    }
  })
})

adminRouter.delete('/:teamid', function (req, res, next) {
  var id = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  teamdb.team.remove({_id: id}, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove team", err: err.message})
    } else {
      res.status(200).send({msg: "Team has been removed!"})
    }
  })
})

adminRouter.post('/', function (req, res) {
  var team = req.body
  console.log(competitiondb.competition.path('leagues'))
  var newTeam = new teamdb.team({
    name       : team.name,
    league     : team.league,
    competition: team.competition
  })
  
  newTeam.save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving team", err: err.message})
    } else {
      res.location("/api/teams/" + data._id)
      res.status(201).send({msg: "New team has been saved", id: data._id})
    }
  })
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