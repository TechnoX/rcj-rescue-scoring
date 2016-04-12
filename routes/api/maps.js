//========================================================================
//                          Libraries
//========================================================================

var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var mapdb = require('../../models/map')
var query = require('../../helper/query-helper')
var validator = require('validator')
var async = require('async')
var ObjectId = require('mongoose').Types.ObjectId
var logger = require('../../config/logger').mainLogger
var fs = require('fs')
var async = require('async')

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
privateRouter.get('/', function (req, res) {
  var populate
  if (req.query['populate'] !== undefined) {
    populate = req.query['populate']
  }
  if (populate !== undefined && populate) {
    query.doFindResultSortQuery(req, res, null, {path: 'tiles', populate: {path: 'tileType'}}, mapdb.map)
  } else {
    query.doFindResultSortQuery(req, res, null, null, mapdb.map)
  }
})

adminRouter.get('/tiletypes', function (req, res) {
  query.doFindResultSortQuery(req, res, null, null, mapdb.tileType)
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
privateRouter.get('/:mapid', function (req, res, next) {
  var id = req.params.mapid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  var populate
  if (req.query['populate'] !== undefined) {
    populate = req.query['populate']
  }
  if (populate !== undefined && populate) {
    query.doIdQuery(req, res, id, "", mapdb.map, {path: 'tiles', populate: {path: 'tileType'}})
  } else {
    query.doIdQuery(req, res, id, "", mapdb.map)
  }
})

adminRouter.post('/createmap', function (req, res) {
  var map = req.body
  var tiles = []
  for (var i in map.tiles.length) {
    var tile = map.tiles[i]

    if (isNan(i)) {
      var coords = i.split(',')
      tile.x = coords[0]
      tile.y = coords[1]
      tile.z = coords[2]
    }

    var tileTypeId = typeof tile.tileType === 'object' ? tile.tileType._id : tile.tileType
    tiles.push({
      x        : tile.x,
      y        : tile.y,
      z        : tile.z,
      tileType : tileTypeId,
      rot      : tile.rot,
      items    : {
        obstacles : tile.items.obstacles,
        speedbumps: tile.items.speedbumps
      },
      levelUp  : tile.levelUp,
      levelDown: tile.levelDown
    })
  }

  var newMap = new mapdb.map({
    name  : map.name,
    height: map.height,
    width : map.width,
    length: map.length,
    tiles : tiles,
    startTile : {
      x : map.startTile.x,
      y : map.startTile.y,
      z : map.startTile.z
    },
    numberOfDropTiles : map.numberOfDropTiles
  })

  newMap.save(function (err, data) {
    if (err) {
      res.status(400).send({msg: "Error saving map"})
    } else {
      res.status(201).send({msg: "New map has been saved", id: data._id})
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
