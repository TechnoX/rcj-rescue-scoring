"use strict"
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const lineMap = require('../../models/lineMap').lineMap
const tileType = require('../../models/lineMap').tileType
const tileSet = require('../../models/lineMap').tileSet
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')


publicRouter.get('/', getLineMaps)
function getLineMaps(req, res) {
  const competition = req.query.competition || req.params.competition

  var query
  if (competition != null && competition.constructor === String) {
    query = lineMap.find({competition: competition})
  } else if (Array.isArray(competition)) {
    query = lineMap.find({competition: {$in: competition.filter(ObjectId.isValid)}})
  } else {
    query = lineMap.find({})
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
module.exports.getLineMaps = getLineMaps

adminRouter.post('/', function (req, res) {
  const map = req.body

  //logger.debug(map)

  const tiles = []
  for (let i in map.tiles) {
    if (map.tiles.hasOwnProperty(i)) {
      const tile = map.tiles[i]

      if (isNaN(i)) {
        const coords = i.split(',')
        tile.x = coords[0]
        tile.y = coords[1]
        tile.z = coords[2]
      }

      //logger.debug(tile)

      const tileTypeId = typeof tile.tileType ===
                         'object' ? tile.tileType._id : tile.tileType
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
  }

  //logger.debug(tiles)

  const newMap = new lineMap({
    competition      : map.competition,
    name             : map.name,
    height           : map.height,
    width            : map.width,
    length           : map.length,
    tiles            : tiles,
    startTile        : {
      x: map.startTile.x,
      y: map.startTile.y,
      z: map.startTile.z
    },
    numberOfDropTiles: map.numberOfDropTiles,
    finished         : map.finished
  })

  //logger.debug(newMap)

  newMap.save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving map", err: err.message})
    } else {
      res.location("/api/maps/line/" + data._id)
      res.status(201).send({msg: "New map has been saved", id: data._id})
    }
  })
})


publicRouter.get('/:map', function (req, res, next) {
  const id = req.params.map

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const query = lineMap.findById(id)
  var populate
  if (req.query['populate'] !== undefined && req.query['populate']) {
    query.populate("tiles.tileType", "-paths -__v")
  }

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


})

adminRouter.delete('/:map', function (req, res, next) {
  const id = req.params.map

  if (!ObjectId.isValid(id)) {
    return next()
  }

  lineMap.remove({_id: id}, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove map", err: err.message})
    } else {
      res.status(200).send({msg: "Map has been removed!"})
    }
  })
})


publicRouter.get('/tiletypes', getTileTypes)

publicRouter.get('/tiletypes/:tiletype', function (req, res, next) {
  const id = req.params.tiletype

  if (!ObjectId.isValid(id)) {
    return next()
  }

  return getTileTypes(req, res, next)
})

function getTileTypes(req, res) {
  const tileTypes = req.query.id || req.body.id || req.params.tiletype

  var query
  if (tileTypes != null && tileTypes.constructor === String) {
    // String with single id
    query = tileType.findById(tileTypes)
  } else if (Array.isArray(tileTypes)) {
    // Array of ids
    query = tileType.find({_id: {$in: tileTypes.filter(ObjectId.isValid)}})
  } else {
    // Get all
    query = tileType.find({})
  }

  query.select("-paths -__v")
  
  query.lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get tiletypes", err: err.message})
    } else {
      res.status(200).send(data)
    }
  })
}

publicRouter.get('/tilesets', getTileSets)
function getTileSets(req, res, next) {

  // Get all
  const query = tileSet.find({})

  query.select("__id name")

  if (req.query['populate'] !== undefined && req.query['populate']) {
    query.select("tiles")
    query.populate("tiles", "-_id")
    query.populate("tiles.tileType", "-gaps -intersections -paths -__v")
  }

  query.lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      return res.status(400).send({msg: "Could not get tile sets", err: err.message})
    } else {
      return res.status(200).send(data)
    }
  })
}
module.exports.getTileSets = getTileSets

adminRouter.post('/tilesets', function (req, res, next) {
  const tileset = req.body

  new tileSet({
    name: tileset.name
  }).save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving tileset", err: err.message})
    } else {
      res.location("/api/maps/line/tilesets" + data._id)
      res.status(201).send({msg: "New tileset has been saved", id: data._id})
    }
  })
})

publicRouter.get('/tilesets/:tileset', function (req, res, next) {
  const id = req.params.tileset

  if (!ObjectId.isValid(id)) {
    return next()
  }

  tileSet.findById(id)
    .select("_id name tiles")
    .populate("tiles", "-_id")
    .populate("tiles.tileType", "-paths -__v")
    .lean()
    .exec((err, data) => {
      if (err) {
        logger.error(err)
        res.status(400).send({msg: "Could not get tile set", err: err.message})
      } else {
        res.status(200).send(data)
      }
    })
})

adminRouter.put('/tilesets/:tileset', function (req, res, next) {
  const id = req.params.tileset

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const _tileSet = req.body

  tileSet.findById(id, (err, dbTileSet) => {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get tile set", err: err.message})
    } else {
      dbTileSet.tiles = _tileSet.tiles
      dbTileSet.save((err, data)=> {
        if (err) {
          logger.error(err)
          res.status(400).send({msg: "Could not get tile set", err: err.message})
        } else {
          res.status(200).send({msg: "TileSet updated!"})
        }
      })
    }
  })

})

adminRouter.delete('/tilesets/:tileset', function (req, res, next) {
  const id = req.params.tileset

  if (!ObjectId.isValid(id)) {
    return next()
  }

  tileSet.remove({_id: id}, (err) => {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove tileset", err: err.message})
    } else {
      res.status(200).send({msg: "Tileset has been removed!"})
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
