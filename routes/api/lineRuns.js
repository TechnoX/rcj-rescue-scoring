"use strict"
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const lineRun = require('../../models/lineRun').lineRun
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const pathFinder = require('../../helper/pathFinder')
const scoreCalculator = require('../../helper/scoreCalculator')
const auth = require('../../helper/authLevels')
const ACCESSLEVELS = require('../../models/user').ACCESSLEVELS

var socketIo

module.exports.connectSocketIo = function (io) {
  socketIo = io
}

/**
 * @api {get} /runs/line Get runs
 * @apiName GetRun
 * @apiGroup Run
 * @apiVersion 1.0.1
 *
 * @apiParam {Boolean} [populate] Whether to populate references with name
 *
 * @apiSuccess (200) {Object[]} -             Array of runs
 * @apiSuccess (200) {String}   -._id
 * @apiSuccess (200) {String}   -.competition
 * @apiSuccess (200) {String}   -.round
 * @apiSuccess (200) {String}   -.team
 * @apiSuccess (200) {String}   -.field
 * @apiSuccess (200) {String}   -.map
 * @apiSuccess (200) {Number}   -.score
 * @apiSuccess (200) {Object}   -.time
 * @apiSuccess (200) {Number}   -.time.minutes
 * @apiSuccess (200) {Number}   -.time.seconds
 * @apiSuccess (200) {Number}   -.status
 * @apiSuccess (200) {Number}   -.rescuedLiveVictims
 * @apiSuccess (200) {Number}   -.rescuedDeadVictims
 * @apiSuccess (200) {Object[]} -             Array of LoPs
 *
 * @apiError (400) {String} msg The error message
 */
publicRouter.get('/', getLineRuns)

function getLineRuns(req, res) {
  const competition = req.query.competition || req.params.competition
  
  var query
  if (competition != null && competition.constructor === String) {
    if (req.query['ended'] == 'false') {
      query = lineRun.find({
        competition: competition,
        status     : {$lte: 1}
      })
    } else {
      query = lineRun.find({
        competition: competition
      })
    }
    
  } else if (Array.isArray(competition)) {
    query = lineRun.find({
      competition: {
        $in: competition.filter(ObjectId.isValid)
      }
    })
  } else {
    query = lineRun.find({})
  }
  
  if (req.query['minimum']) {
    query.select("competition round team field status started startTime")
  } else {
    query.select("competition round team field map score time status started rescuedLiveVictims rescuedDeadVictimsBefore rescuedDeadVictimsAfter LoPs comment startTime")
  }
  
  
  if (req.query['populate'] !== undefined && req.query['populate']) {
    query.populate([
      {
        path  : "competition",
        select: "name"
      },
      {
        path  : "round",
        select: "name"
      },
      {
        path  : "team",
        select: "name"
      },
      {
        path  : "field",
        select: "name"
      },
      {
        path  : "map",
        select: "name"
      }
    ])
  }
  
  query.lean().exec(function (err, dbRuns) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get runs"
      })
    } else if (dbRuns) {
      
      // Hide map and field from public
      for (let i = 0; i < dbRuns.length; i++) {
        if (!auth.authViewRun(req.user, dbRuns[i], ACCESSLEVELS.NONE + 1)) {
          delete dbRuns[i].map
          delete dbRuns[i].field
          delete dbRuns[i].comment
          delete dbRuns[i].sign
        }
      }
      res.status(200).send(dbRuns)
    }
  })
}
module.exports.getLineRuns = getLineRuns

publicRouter.get('/latest', getLatestLineRun)

function getLatestLineRun(req, res) {
  const competition = req.query.competition || req.params.competition
  const field = req.query.field || req.params.field
  const fields = req.query.fields
  
  var selection = {
    competition: competition,
    field      : field
  }
  if (selection.competition == undefined) {
    delete selection.competition
  }
  if (selection.field == undefined) {
    delete selection.field
  }
  
  if (fields != null) {
    selection.field = {
      $in: fields
    }
  }
  
  var query = lineRun.findOne(selection).sort("-updatedAt")
  
  if (req.query['populate'] !== undefined && req.query['populate']) {
    query.populate(["round", "team", "field", "competition", {
      path    : 'tiles',
      populate: {
        path: 'tileType'
      }
    }])
  }
  
  query.lean().exec(function (err, dbRun) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get run"
      })
    } else if (dbRun) {
      // Hide map and field from public
      if (!auth.authViewRun(req.user, dbRun, ACCESSLEVELS.NONE + 1)) {
        delete dbRun.map
        delete dbRun.field
        delete dbRun.comment
        delete dbRun.sign
      }
      res.status(200).send(dbRun)
    }
  })
}
module.exports.getLatestLineRun = getLatestLineRun

publicRouter.get('/find/:competitionid/:field/:status', function (req, res, next) {
  var id = req.params.competitionid
  var field_id = req.params.field
  var status = req.params.status
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if (!ObjectId.isValid(field_id)) {
    return next()
  }
  var query = lineRun.find({
    competition: id,
    field      : field_id,
    status     : status
  }, "field team competition status")
  query.populate(["team"])
  query.exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get runs"
      })
    } else {
      res.status(200).send(data)
    }
  })
})


/**
 * @api {get} /runs/line/:runid Get run
 * @apiName GetRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {String} runid The run id
 *
 * @apiParam {Boolean} [populate] Whether to populate object references
 *
 * @apiSuccess (200) {String}       _id
 * @apiSuccess (200) {String}       competition
 * @apiSuccess (200) {String}       round
 * @apiSuccess (200) {String}       team
 * @apiSuccess (200) {String}       field
 * @apiSuccess (200) {String}       map
 *
 * @apiSuccess (200) {Object[]}     tiles
 * @apiSuccess (200) {Boolean}      tiles.isDropTile
 * @apiSuccess (200) {Object}       tiles.scoredItems
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.obstacles
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.speedbumps
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.intersection
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.gaps
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.dropTile
 * @apiSuccess (200) {Number[]}     LoPs
 * @apiSuccess (200) {Number}       evacuationLevel
 * @apiSuccess (200) {Boolean}      exitBonus
 * @apiSuccess (200) {Number}       rescuedLiveVictims
 * @apiSuccess (200) {Number}       rescuedDeadVictims
 * @apiSuccess (200) {Number}       score
 * @apiSuccess (200) {Boolean}      showedUp
 * @apiSuccess (200) {Object}       time
 * @apiSuccess (200) {Number{0-8}}  time.minutes
 * @apiSuccess (200) {Number{0-59}} time.seconds
 *
 * @apiError (400) {String} err The error message
 * @apiError (400) {String} msg The error message
 */
publicRouter.get('/:runid', function (req, res, next) {
  const id = req.params.runid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  const query = lineRun.findById(id, "-__v")
  
  if (req.query['populate'] !== undefined && req.query['populate']) {
    query.populate(["round", "team", "field", "competition", {
      path    : 'tiles',
      populate: {
        path: 'tileType'
      }
    }])
  }
  
  query.lean().exec(function (err, dbRun) {
    if (err) {
      logger.error(err)
      return res.status(400).send({
        err: err.message,
        msg: "Could not get run"
      })
    } else if (dbRun) {
      // Hide map and field from public
      if (!auth.authViewRun(req.user, dbRun, ACCESSLEVELS.NONE + 1)) {
        delete dbRun.map
        delete dbRun.field
        delete dbRun.comment
        delete dbRun.sign
      }
      return res.status(200).send(dbRun)
    }
  })
})

/**
 * @api {put} /runs/line/:runid Update run
 * @apiName PutRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {String} runid The run id
 
 * @apiParam {Object[]}     [tiles]
 * @apiParam {Boolean}      [tiles.isDropTile]
 * @apiParam {Object}       [tiles.scoredItems]
 * @apiParam {Boolean}      [tiles.scoredItems.obstacles]
 * @apiParam {Boolean}      [tiles.scoredItems.speedbumps]
 * @apiParam {Boolean}      [tiles.scoredItems.intersection]
 * @apiParam {Boolean}      [tiles.scoredItems.gaps]
 * @apiParam {Boolean}      [tiles.scoredItems.dropTile]
 * @apiParam {Number[]}     [LoPs]
 * @apiParam {Number=1,2}   [evacuationLevel]
 * @apiParam {Boolean}      [exitBonus]
 * @apiParam {Number}       [rescuedLiveVictims]
 * @apiParam {Number}       [rescuedDeadVictims]
 * @apiParam {Boolean}      [showedUp]
 * @apiParam {Object}       [time]
 * @apiParam {Number{0-8}}  [time.minutes]
 * @apiParam {Number{0-59}} [time.seconds]
 *
 * @apiSuccess (200) {String} msg   Success msg
 * @apiSuccess (200) {String} score The current score
 *
 * @apiError (400) {String} err The error message
 * @apiError (400) {String} msg The error message
 */
privateRouter.put('/:runid', function (req, res, next) {
  const id = req.params.runid
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  const run = req.body
  
  // Exclude fields that are not allowed to be publicly changed
  delete run._id
  delete run.__v
  delete run.map
  delete run.competition
  delete run.round
  delete run.team
  delete run.field
  delete run.score
  
  //logger.debug(run)
  
  lineRun.findById(id)
  //.select("-_id -__v -competition -round -team -field -score")
    .populate({
      path    : 'map',
      populate: {
        path: 'tiles.tileType'
      }
    })
    .exec(function (err, dbRun) {
      if (err) {
        logger.error(err)
        res.status(400).send({
          msg: "Could not get run",
          err: err.message
        })
      } else if (dbRun) {
        if (run.tiles != null && run.tiles.constructor === Object) { // Handle dict as "sparse" array
          const tiles = run.tiles
          run.tiles = []
          Object.keys(tiles).forEach(function (key) {
            if (!isNaN(key)) {
              run.tiles[key] = tiles[key]
            }
          })
        }
        
        if (run.LoPs != null && run.LoPs.length != dbRun.LoPs.length) {
          dbRun.LoPs.length = run.LoPs.length
        }
        
        // Recursively updates properties in "dbObj" from "obj"
        const copyProperties = function (obj, dbObj) {
          for (let prop in obj) {
            if (obj.constructor == Array ||
                (obj.hasOwnProperty(prop) &&
                 (dbObj.hasOwnProperty(prop) ||
                  (dbObj.get !== undefined &&
                   dbObj.get(prop) !== undefined)))) { // Mongoose objects don't have hasOwnProperty
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
        
        err = copyProperties(run, dbRun)
        
        if (err) {
          logger.error(err)
          return res.status(400).send({
            err: err.message,
            msg: "Could not save run"
          })
        }
        
        dbRun.score = scoreCalculator.calculateLineScore(dbRun)
        
        if (dbRun.score > 0 || dbRun.time.minutes != 0 ||
            dbRun.time.seconds != 0 || dbRun.status >= 2) {
          dbRun.started = true
        } else {
          dbRun.started = false
        }
        
        dbRun.save(function (err) {
          if (err) {
            logger.error(err)
            return res.status(400).send({
              err: err.message,
              msg: "Could not save run"
            })
          } else {
            if (socketIo !== undefined) {
              socketIo.sockets.in('runs/line').emit('changed')
              socketIo.sockets.in('competition/' +
                                  dbRun.competition).emit('changed')
              socketIo.sockets.in('runs/' + dbRun._id).emit('data', dbRun)
              socketIo.sockets.in('fields/' +
                                  dbRun.field).emit('data', {
                newRun: dbRun._id
              })
            }
            return res.status(200).send({
              msg  : "Saved run",
              score: dbRun.score
            })
          }
        })
      }
    })
})

/**
 * @api {delete} /runs/line/:runid Delete run
 * @apiName DeleteRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {String} runid The run id
 *
 * @apiSuccess (200) {String} msg Success msg
 *
 * @apiError (400) {String} err The error message
 */
adminRouter.delete('/:runid', function (req, res, next) {
  var id = req.params.runid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  lineRun.remove({
    _id: id
  }, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not remove run",
        err: err.message
      })
    } else {
      res.status(200).send({
        msg: "Run has been removed!"
      })
    }
  })
})

/**
 * @api {post} /runs/line Create new run
 * @apiName PostRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {String} competition The competition id
 * @apiParam {String} round       The round id
 * @apiParam {String} team        The team id
 * @apiParam {String} field       The field id
 * @apiParam {String} map         The map id
 *
 * @apiSuccess (200) {String} msg Success msg
 * @apiSuccess (200) {String} id  The new run id
 *
 * @apiError (400) {String} err The error message
 */
adminRouter.post('/', function (req, res) {
  const run = req.body
  
  new lineRun({
    competition: run.competition,
    round      : run.round,
    team       : run.team,
    field      : run.field,
    map        : run.map,
    startTime  : run.startTime
  }).save(function (err, data) {
    if (err) {
      logger.error(err)
      return res.status(400).send({
        msg: "Error saving run in db",
        err: err.message
      })
    } else {
      res.location("/api/runs/" + data._id)
      return res.status(201).send({
        err: "New run has been saved",
        id : data._id
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
