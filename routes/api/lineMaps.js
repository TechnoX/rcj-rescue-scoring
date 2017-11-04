"use strict"
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const lineMap = require('../../models/lineMap').lineMap
const lineRun = require('../../models/lineRun').lineRun
const tileType = require('../../models/lineMap').tileType
const tileSet = require('../../models/lineMap').tileSet
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')


privateRouter.get('/', getLineMaps)

function getLineMaps(req, res) {
  const competition = req.query.competition || req.params.competition
  
  var query
  if (competition != null && competition.constructor === String) {
    query = lineMap.find({
      competition: competition
    })
  } else if (Array.isArray(competition)) {
    query = lineMap.find({
      competition: {
        $in: competition.filter(ObjectId.isValid)
      }
    })
  } else {
    query = lineMap.find({})
  }
  
  query.select("competition name")
  
  query.lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      return res.status(400).send({
        msg: "Could not get maps"
      })
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
      res.status(400).send({
        msg: "Error saving map",
        err: err.message
      })
    } else {
      res.location("/api/maps/line/" + data._id)
      res.status(201).send({
        msg: "New map has been saved",
        id : data._id
      })
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
      res.status(400).send({
        msg: "Could not get map",
        err: err.message
      })
    } else {
      res.status(200).send(data)
    }
  })
})

// Recursively updates properties in "dbObj" from "obj"
const copyProperties = function (obj, dbObj) {
  for (let prop in obj) {
    if (obj.constructor == Array ||
        (obj.hasOwnProperty(prop) &&
         (dbObj.hasOwnProperty(prop) ||
          (dbObj.get !== undefined && dbObj.get(prop) !== undefined)))) { // Mongoose objects don't have hasOwnProperty
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
  delete map.indexCount
  
  lineMap.findById(id, function (err, dbMap) {
    if (err) {
      logger.error(err)
      return res.status(400).send({
        msg: "Could not get map",
        err: err.message
      })
    } else {
      
      let tiles = []
      for (let i in map.tiles) {
        if (map.tiles.hasOwnProperty(i)) {
          let tile = map.tiles[i]
          if (isNaN(i)) {
            const coords = i.split(',')
            tile.x = coords[0]
            tile.y = coords[1]
            tile.z = coords[2]
          }
          tiles.push(tile)
        }
      }
      map.tiles = tiles
      
      //logger.debug(map)
      dbMap.tiles = []
      err = copyProperties(map, dbMap)
      
      if (err) {
        logger.error(err)
        return res.status(400).send({
          err: err.message,
          msg: "Could not save map"
        })
      }
      
      lineRun.findOne({
        map    : id,
        started: true
      }).lean().exec(function (err, dbRun) {
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
          dbMap.save(function (err) {
            if (err) {
              logger.error(err)
              return res.status(400).send({
                msg: "Could not save map",
                err: err.message
              })
            } else {
              return res.status(200).send({
                msg: "Saved!"
              })
            }
          })
        }
      })
    }
  })
})

adminRouter.delete('/:map', function (req, res, next) {
  const id = req.params.map
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  lineRun.findOne({map: id, started: true}, function (err, dbRun) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove map", err: err.message})
    } else if (dbRun) {
      const err = new Error("Can't remove map with started run connected!")
      logger.error(err)
      res.status(400).send({msg: "Could not remove map", err: err.message})
    } else {
      lineRun.remove({map: id}, function (err) {
        if (err) {
          logger.error(err)
        } else {
          lineMap.remove({_id: id}, function (err) {
            if (err) {
              logger.error(err)
              res.status(400).send({
                msg: "Could not remove map",
                err: err.message
              })
            } else {
              res.status(200).send({msg: "Map has been removed!"})
            }
          })
        }
      })
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
    query = tileType.find({
      _id: {
        $in: tileTypes.filter(ObjectId.isValid)
      }
    })
  } else {
    // Get all
    query = tileType.find({})
  }
  
  query.select("-paths -__v")
  
  query.lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get tiletypes",
        err: err.message
      })
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
      return res.status(400).send({
        msg: "Could not get tile sets",
        err: err.message
      })
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
      res.status(400).send({
        msg: "Error saving tileset",
        err: err.message
      })
    } else {
      res.location("/api/maps/line/tilesets" + data._id)
      res.status(201).send({
        msg: "New tileset has been saved",
        id : data._id
      })
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
        res.status(400).send({
          msg: "Could not get tile set",
          err: err.message
        })
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
      res.status(400).send({
        msg: "Could not get tile set",
        err: err.message
      })
    } else {
      dbTileSet.tiles = _tileSet.tiles
      dbTileSet.save((err, data) => {
        if (err) {
          logger.error(err)
          res.status(400).send({
            msg: "Could not get tile set",
            err: err.message
          })
        } else {
          res.status(200).send({
            msg: "TileSet updated!"
          })
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
  
  tileSet.remove({
    _id: id
  }, (err) => {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not remove tileset",
        err: err.message
      })
    } else {
      res.status(200).send({
        msg: "Tileset has been removed!"
      })
    }
  })
})


privateRouter.get('/name/:competitionid/:name', function (req, res, next) {
  var name = req.params.name
  var id = req.params.competitionid
  
  lineMap.find({
    "competition": id,
    "name": name
  }, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get teams"
      })
    } else {
      res.status(200).send(data)
    }
  }).select("_id")
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
