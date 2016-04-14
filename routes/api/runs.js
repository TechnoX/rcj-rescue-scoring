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
var scoreCalculator = require('../../helper/scoreCalculator')

var socketIo

module.exports.connectSocketIo = function(io) {
  socketIo = io
}

publicRouter.get('/', function (req, res) {
  query.doFindResultSortQuery(req, res, null, null, competitiondb.run)
})

publicRouter.get('/:runid', function (req, res, next) {
  var id = req.params.runid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  var populate
  if (req.query['populate'] !== undefined && req.query['populate']) {
    populate = ["round", "team", "field", "competition", {path: 'tiles', populate: {path: 'tileType'}}]
  }

  var query = competitiondb.run.findById(id)
  if (populate !== undefined) {
    query.populate(populate)
  }
  query.exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get run"})
    } else {
      res.status(200).send(data)
    }
  })
})

privateRouter.post('/:runid/update', function (req, res, next) {
  var id = req.params.runid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  var run = req.body

  competitiondb.run.findById(id, function (err, dbrun) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get run"})
    } else {
      if (run.showedUp !== undefined) {
        dbrun.showedUp = run.showedUp
      }
      if (run.LoPs !== undefined) {
        dbrun.LoPs = run.LoPs
      }
      if (run.rescuedVictims !== undefined) {
        dbrun.rescuedVictims = run.rescuedVictims
      }
      if (run.time !== undefined && run.time.minutes !== undefined && run.time.seconds !== undefined) {
        dbrun.time.minutes = run.time.minutes
        dbrun.time.seconds = run.time.seconds
      }
      if (run.tiles !== undefined) {

        for (var i in run.tiles) {
          var tile = run.tiles[i]

          for (var j in dbrun.tiles) {
            var dbtile = dbrun.tiles[j]
            if (tile.x == dbtile.x &&
                tile.y == dbtile.y &&
                tile.z == dbtile.z) {

              if (tile.items !== undefined) {
                if (tile.items.dropTiles !== undefined) {
                  dbtile.items.dropTiles = tile.items.dropTiles
                }
              }

              if (tile.scoredItems !== undefined) {
                if (tile.scoredItems.obstacles !== undefined) {
                  dbtile.scoredItems.obstacles = tile.scoredItems.obstacles
                }
                if (tile.scoredItems.speedbumps !== undefined) {
                  dbtile.scoredItems.speedbumps = tile.scoredItems.speedbumps
                }
                if (tile.scoredItems.intersections !== undefined) {
                  dbtile.scoredItems.intersections = tile.scoredItems.intersections
                }
                if (tile.scoredItems.gaps !== undefined) {
                  dbtile.scoredItems.gaps = tile.scoredItems.gaps
                }
                if (tile.scoredItems.dropTiles !== undefined) {
                  dbtile.scoredItems.dropTiles = tile.scoredItems.dropTiles
                }
              }
              break
            }
          }
        }
      }

      dbrun.score = scoreCalculator.calculateScore(dbrun)

      dbrun.save(function (err) {
        if (err) {
          logger.error(err)
          res.status(400).send({msg: "Could not save run"})
        } else {
          if (socketIo !== undefined) {
            socketIo.sockets.in('runs/' + dbrun._id).emit('data', dbrun)
          }
          res.status(200).send({msg: "Saved run"})
        }
      })
    }
  })
})

adminRouter.get('/:runid/delete', function (req, res, next) {
  var id = req.params.runid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.run.remove({_id: id}, function (err) {
    if (err) {
      logger.error(err)
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

  if (!ObjectId.isValid(mapId) || !ObjectId.isValid(roundId) || !ObjectId.isValid(teamId) ||
      !ObjectId.isValid(fieldId) || !ObjectId.isValid(competitionId)) {
    return next()
  }

  var map
  var round
  var team
  var field
  var competition

  async.parallel([
    function (cb) {
      mapdb.map.findById(mapId).populate({
        path    : 'tiles',
        populate: {path: 'tileType'}
      }).exec(function (err, dbmap) {
        map = dbmap
        return cb(err)
      })
    },
    function (cb) {
      competitiondb.round.findById(roundId, function (err, dbround) {
        round = dbround
        return cb(err)
      })
    },
    function (cb) {
      competitiondb.team.findById(teamId, function (err, dbteam) {
        team = dbteam
        return cb(err)
      })
    },
    function (cb) {
      competitiondb.field.findById(fieldId, function (err, dbfield) {
        field = dbfield
        return cb(err)
      })
    },
    function (cb) {
      competitiondb.competition.findById(competitionId, function (err, dbcompetition) {
        competition = dbcompetition
        return cb(err)
      })
    }
  ], function (err) {
    if (err) {
      logger.error(err)
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

      var foundPath = pathFinder.findPath(map)

      var tiles = []
      logger.debug(foundPath)
      for (var i in foundPath) {
        var tile = foundPath[i]
        logger.debug(i)
        logger.debug(JSON.stringify(tile))

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
            gaps         : tile.scoreItems.gaps,
            dropTiles : 0
          },
          scoredItems: {
            obstacles    : filledArray(tile.scoreItems.obstacles, false),
            speedbumps   : filledArray(tile.scoreItems.speedbumps, false),
            intersections: filledArray(tile.scoreItems.intersections, false),
            gaps         : filledArray(tile.scoreItems.gaps, false),
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
        LoPs             : filledArray(map.numberOfDropTiles, 0),
        rescuedVictims   : 0,
        score            : 0,
        showedUp         : false,
        time             : {
          minutes: 0,
          seconds: 0
        }
      })

      newRun.save(function (err, data) {
        if (err) {
          logger.error(err)
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

function filledArray(len, val) {
  var arr = []
  for (var i = 0; i < len; i++) {
    arr.push(val)
  }
  return arr
}

publicRouter.all('*', function (req, res, next) {
  next()
})
privateRouter.all('*', function (req, res, next) {
  next()
})

module.exports.public = publicRouter
module.exports.private = privateRouter
module.exports.admin = adminRouter