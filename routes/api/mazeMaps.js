"use strict"
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const mazeMap = require('../../models/mazeMap').mazeMap
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
      return res.status(400).send({msg: "Could not get maps"})
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
    competition      : map.competition,
    name             : map.name,
    height           : map.height,
    width            : map.width,
    length           : map.length,
    cells            : cells,
    startTile        : {
      x: map.startTile.x,
      y: map.startTile.y,
      z: map.startTile.z
    }
  })

  //logger.debug(newMap)

  newMap.save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving map"})
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
      res.status(400).send({msg: "Could not get map"})
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


})

adminRouter.delete('/:map', function (req, res, next) {
  const id = req.params.map

  if (!ObjectId.isValid(id)) {
    return next()
  }

  mazeMap.remove({_id: id}, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove map"})
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
