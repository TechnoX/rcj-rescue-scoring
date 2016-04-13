//========================================================================
//                          Libraries
//========================================================================

var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var competitiondb = require('../../models/competition')
var mapdb = require('../../models/map')
var query = require('../../helper/query-helper')
var validator = require('validator')
var async = require('async')
var ObjectId = require('mongoose').Types.ObjectId
var logger = require('../../config/logger').mainLogger
var fs = require('fs')
var pathFinder = require('../../helper/pathFinder')
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
  query.doFindResultSortQuery(req, res, null, null, competitiondb.runs)
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
publicRouter.get('/:runid', function (req, res, next) {
  var id = req.params.runid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  query.doIdQuery(req, res, id, "", competitiondb.run)
})

adminRouter.get('/:runid/delete', function (req, res, next) {
  var id = req.params.runid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.run.remove({_id: id}, function (err) {
    if (err) {
      res.status(400).send({msg: "Could not remove run"})
    } else {
      res.status(200).send({msg: "Run has been removed!"})
    }
  })
})

adminRouter.post('/createrun', function (req, res) {
  var run = req.body

  var mapId = run.map
  var roundId = run.round
  var teamId = run.team
  var fieldId = run.field
  var competitionId = run.competition

  if (!ObjectId.isValid(mapId) || !ObjectId.isValid(roundId) ||
      !ObjectId.isValid(teamId) || !ObjectId.isValid(fieldId) ||
      !ObjectId.isValid(competitionId)) {
    return next()
  }

  var map
  var round
  var team
  var field
  var competition

  async.parallel([
    function (cb) {
      mapdb.map.findOne({_id: mapId}).populate({
        path    : 'tiles',
        populate: {path: 'tileType'}
      }).exec(function (err, dbmap) {
        map = dbmap
        return cb(err)
      })
    },
    function (cb) {
      competitiondb.round.findOne({_id: roundId}, function (err, dbround) {
        round = dbround
        return cb(err)
      })
    },
    function (cb) {
      competitiondb.team.findOne({_id: teamId}, function (err, dbteam) {
        team = dbteam
        return cb(err)
      })
    },
    function (cb) {
      competitiondb.field.findOne({_id: fieldId}, function (err, dbfield) {
        field = dbfield
        return cb(err)
      })
    },
    function (cb) {
      competitiondb.competition.findOne({_id: competitionId}, function (err, dbcompetition) {
        competition = dbcompetition
        return cb(err)
      })
    }
  ], function (err) {
    if (err) {
      return res.status(400).send({msg: "Error saving run", err: err})
    } else {
      if (map === undefined ||
          round === undefined ||
          team === undefined ||
          field === undefined ||
          competition === undefined) {
        return res.status(400).send({msg: "Error saving run, could't find references in database"})
      }
      logger.debug(team.competition + "=" + competition._id)
      logger.debug(round.competition + "=" + competition._id)
      logger.debug(field.competition + "=" + competition._id)

      if (team.competition != competition._id.toString() ||
          round.competition != competition._id.toString() ||
          field.competition != competition._id.toString()) {
        return res.status(400).send({msg: "Error saving run, mismatch with competition id"})
      }

      var path = pathFinder.findPath(map)

      var tiles = []

      for (var i in path) {
        var tile = path[i]
        var newTile = {
          x          : tile.x,
          y          : tile.y,
          z          : tile.z,
          tileType   : tile.tileType._id,
          rot        : tile.rot,
          items      : {
            obstacles    : tile.scoreItems.obstacles,
            speedbumps   : tile.scoreItems.speedbumps,
            intersections: tile.scoreItems.intersections,
            gaps         : tile.scoreItems.gaps
          },
          scoredItems: {
            obstacles    : new Array(tile.scoreItems.obstacles).fill(false),
            speedbumps   : new Array(tile.scoreItems.speedbumps).fill(false),
            intersections: new Array(tile.scoreItems.intersections).fill(false),
            gaps         : new Array(tile.scoreItems.gaps).fill(false),
            dropTiles    : []
          },
          index      : tile.index,
          levelUp    : tile.levelUp,
          levelDown  : tile.levelDown
        }
        tiles.push(newTile)
      }

      var newRun = new competitiondb.run({
        round      : round._id,
        team       : team._id,
        field      : field._id,
        competition: competition._id,

        height           : map.height,
        width            : map.width,
        length           : map.length,
        tiles            : tiles,
        startTile        : map.startTile,
        numberOfDropTiles: map.numberOfDropTiles,
        LoPs             : new Array(map.numberOfDropTiles),
        rescuedVictims   : 0,
        score            : 0,
        time             : {
          minutes: 0,
          seconds: 0
        }
      })

      newRun.save(function (err, data) {
        if (err) {
          return res.status(400).send({msg: "Error saving run in db"})
        } else {
          return res.status(201).send({
            msg: "New run has been saved",
            id : data._id
          })
        }
      })
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