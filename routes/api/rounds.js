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
//========================================================================
//                          /maps Api endpoints
//========================================================================


/**
 * @api {get} /maps Request units
 * @apiName GetUnits
 * @apiGroup Unit
 * @apiVersion 1.0.0
 *
 * @apiParam {String} [result] Filter function
 * @apiParam {String} [find] Select function
 * @apiParam {String} [sort] Sort function
 *
 * @apiSuccess (200) {Object[]} Unit List of units who matched
 * @apiSuccess (200) {String} Unit._id The unique id
 * @apiSuccess (200) {Date}   Unit.createdAt The date this account was created
 * @apiSuccess (200) {Date}   Unit.updatedAt The latest date this account was updates
 * @apiSuccess (200) {String} Unit.file_desc The directory where the units has all its data
 * @apiSuccess (200) {String} Unit.mac_addr The mac address
 * @apiSuccess (200) {String} Unit.last_ip The last ip used by the unit
 * @apiSuccess (200) {String} Unit.name The specific name of this unit, for example "Zelda1"
 * @apiSuccess (200) {String} Unit.status The mode the unit is in
 * @apiSuccess (200) {String} Unit.latest_measure_session The latest measure session
 *
 * @apiSuccess (400) {String} err The error message
 */
publicRouter.get('/', function (req, res) {
  query.doFindResultSortQuery(req, res, null, null, competitiondb.round)
})

/**
 * @api {get} /units/:unitid Request unit
 * @apiName GetUnit
 * @apiGroup Unit
 * @apiVersion 1.0.0
 *
 * @apiParam {Number} id Users unique ID
 *
 * @apiSuccess (200) {Object} Unit The unit matched to the uuid
 * @apiSuccess (200) {String} Unit._id The unique id
 * @apiSuccess (200) {Date}   Unit.createdAt The date this account was created
 * @apiSuccess (200) {Date}   Unit.updatedAt The latest date this account was updates
 * @apiSuccess (200) {String} Unit.file_desc The directory where the units has all its data
 * @apiSuccess (200) {String} Unit.mac_addr The mac address
 * @apiSuccess (200) {String} Unit.last_ip The last ip used by the unit
 * @apiSuccess (200) {String} Unit.name The specific name of this unit, for example "Zelda1"
 * @apiSuccess (200) {String} Unit.status The mode the unit is in
 * @apiSuccess (200) {String} Unit.MeasureSession The latest measure session
 * @apiSuccess (200) {String} Unit.MeasureSession._id The unique id
 * @apiSuccess (200) {Date}   Unit.MeasureSession.createdAt The date this account was created
 * @apiSuccess (200) {Date}   Unit.MeasureSession.updatedAt The latest date this account was updates
 * @apiSuccess (200) {String} Unit.MeasureSession.file_desc The directory where the session has all its data
 * @apiSuccess (200) {String} Unit.MeasureSession.unit What unit it is connected too
 * @apiSuccess (200) {String} Unit.MeasureSession.step_time Step time
 * @apiSuccess (200) {String} Unit.MeasureSession.sample_rate The sample rate
 * @apiSuccess (200) {String} Unit.MeasureSession.step_lvls Step levels
 * @apiSuccess (200) {String} Unit.MeasureSession.repeat_rate The repeat rate
 *
 * @apiSuccess (400) {String} err The error message
 */
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
      res.status(400).send({msg: "Could not get runs"})
    } else {
      res.status(200).send(data)
    }
  })
})

adminRouter.get('/:roundid/delete', function (req, res, next) {
  var id = req.params.roundid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.round.remove({_id : id}, function (err) {
    if (err) {
      res.status(400).send({msg: "Could not remove round"})
    } else {
      res.status(200).send({msg: "Round has been removed!"})
    }
  })
})

adminRouter.post('/createround', function (req, res) {
  var round = req.body

  var newRound = new competitiondb.round({
    name : round.name,
    competition : round.competition
  })

  newRound.save(function (err, data) {
    if (err) {
      res.status(400).send({msg: "Error saving round"})
    } else {
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