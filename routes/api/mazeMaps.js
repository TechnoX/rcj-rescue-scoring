"use strict"
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const mazeMap = require('../../models/mazeMap').mazeMap
const mazeRun = require('../../models/mazeMap').mazeRun
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')


publicRouter.get('/', getMazeMaps)
function getMazeMaps(req, res) {
  const competition = req.query.competition || req.params.competition

  var query
  if (competition != null && competition.constructor === String) {
    query = mazeMap.find({competition: competition})
  } else if (Array.isArray(competition)) {
    query = mazeMap.find({competition: {$in: competition.filter(ObjectId.isValid)}})
  } else {
    query = mazeMap.find({})
  }

  query.select("competition name")

  query.lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      return res.status(400).send({msg: "Could not get maps", err: err.message})
    } else {
      return res.status(200).send(data)
    }
  })
}
module.exports.getMazeMaps = getMazeMaps

adminRouter.post('/', function (req, res) {
  const map = req.body

  //logger.debug(map)

  const cells = []
  for (let i in map.cells) {
    if (map.cells.hasOwnProperty(i)) {
      const cell = map.cells[i]

      if (isNaN(i)) {
        const coords = i.split(',')
        cell.x = coords[0]
        cell.y = coords[1]
        cell.z = coords[2]
      }

      let tile = null
      if (cell.tile != null) {
        tile = {
          checkpoint   : cell.tile.checkpoint,
          speedbump    : cell.tile.speedbump,
          black        : cell.tile.black,
          rampBottom   : cell.tile.rampBottom,
          rampTop      : cell.tile.rampTop,
          changeFloorTo: cell.tile.changeFloorTo
        }

        if (cell.tile.victims != null) {
          tile.victims = {
            top   : cell.tile.victims.top,
            right : cell.tile.victims.right,
            bottom: cell.tile.victims.bottom,
            left  : cell.tile.victims.left
          }
        }
      }

      cells.push({
        x       : cell.x,
        y       : cell.y,
        z       : cell.z,
        isTile  : cell.isTile,
        isWall  : cell.isWall,
        isLinear: cell.isLinear,
        tile    : tile
      })
    }
  }

  //logger.debug(tiles)

  const newMap = new mazeMap({
    competition: map.competition,
    name       : map.name,
    height     : map.height,
    width      : map.width,
    length     : map.length,
    cells      : cells,
    startTile  : {
      x: map.startTile.x,
      y: map.startTile.y,
      z: map.startTile.z
    },
    finished   : map.finished
  })

  //logger.debug(newMap)

  newMap.save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving map", err: err.message})
    } else {
      res.location("/api/maps/maze/" + data._id)
      res.status(201).send({msg: "New map has been saved", id: data._id})
    }
  })
})


publicRouter.get('/:map', function (req, res, next) {
  const id = req.params.map

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const query = mazeMap.findById(id)

  query.select("-cells._id -cells.tile._id")

  query.lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get map", err: err.message})
    } else {
      res.status(200).send(data)
    }
  })
})

adminRouter.put('/:map', function (req, res, next) {
  const id = req.params.map

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const map = req.body

  // Exclude fields that are not allowed to be publicly changed
  delete map._id
  delete map.__v
  delete map.competition

  mazeMap.findById(id, function (err, dbMap) {

    // Recursively updates properties in "dbObj" from "obj"
    const copyProperties = function (obj, dbObj) {
      for (let prop in obj) {
        if (obj.Constructor == Array ||
            (obj.hasOwnProperty(prop) &&
             (dbObj.hasOwnProperty(prop) || dbObj.get(prop) !== undefined))) { // Mongoose objects don't have hasOwnProperty
          if (typeof obj[prop] == 'object' && dbObj[prop] != null) { // Catches object and array
            copyProperties(obj[prop], dbObj[prop])

            if (dbObj.markModified !== undefined) {
              dbObj.markModified(prop)
            }
          } else if (obj[prop] !== undefined) {
            //logger.debug("copy " + prop)
            dbObj[prop] = obj[prop]
          }
        } else {
          return new Error("Illegal key: " + prop)
        }
      }
    }

    dbMap.cells = []
    err = copyProperties(map, dbMap)

    if (err) {
      logger.error(err)
      return res.status(400).send({
        err: err.message,
        msg: "Could not save map"
      })
    }

    mazeRun.findOne({
      map    : id,
      started: true
    }).lean().exec(function (err, dbRun) {
      if (err) {
        if (err) {
          logger.error(err)
          return res.status(400).send({
            msg: "Could not get run",
            err: err.message
          })
        } else if (dbRun) {
          err = new Error("Run " + dbRun._id + " already started on map")
          logger.error(err)
          return res.status(400).send({
            msg: "Run already started on map!",
            err: err.message
          })
        } else {
          return dbMap.save()
        }
      }
    })
  })

})

adminRouter.delete('/:map', function (req, res, next) {
  const id = req.params.map

  if (!ObjectId.isValid(id)) {
    return next()
  }

  mazeMap.remove({_id: id}, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove map", err: err.message})
    } else {
      res.status(200).send({msg: "Map has been removed!"})
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
