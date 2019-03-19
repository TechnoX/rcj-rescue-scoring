//========================================================================
//                          Libraries
//========================================================================

var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var competitiondb = require('../../models/competition')
var query = require('../../helper/query-helper')
var validator = require('validator')
var async = require('async')
var ObjectId = require('mongoose').Types.ObjectId
var logger = require('../../config/logger').mainLogger
var fs = require('fs')


publicRouter.get('/', function (req, res) {
  query.doFindResultSortQuery(req, res, null, null, competitiondb.round)
})

publicRouter.get('/:roundid', function (req, res, next) {
  var id = req.params.roundid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  query.doIdQuery(req, res, id, "", competitiondb.team)
})

publicRouter.get('/:roundid/runs', function (req, res, next) {
  var id = req.params.roundid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  competitiondb.run.find({round: id}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get runs", err: err.message})
    } else {
      res.status(200).send(data)
    }
  })
})

adminRouter.delete('/:roundid', function (req, res, next) {
  var id = req.params.roundid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  competitiondb.round.deleteOne({_id: id}, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove round", err: err.message})
    } else {
      res.status(200).send({msg: "Round has been removed!"})
    }
  })
})

adminRouter.post('/', function (req, res) {
  var round = req.body
  
  var newRound = new competitiondb.round({
    name       : round.name,
    competition: round.competition,
    league     : round.league
  })
  
  newRound.save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving round", err: err.message})
    } else {
      res.location("/api/rounds/" + data._id)
      res.status(201).send({msg: "New round has been saved", id: data._id})
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