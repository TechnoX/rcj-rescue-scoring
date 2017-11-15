"use strict"
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const pathFinder = require('../../leagues/line/pathFinder')
const auth = require('../../helper/authLevels')
const ACCESSLEVELS = require('../../models/user').ACCESSLEVELS

const run = require('../../models/run').run
const baseModel = require('../../models/run').model
const lineRun = require('../../leagues/line/lineRun').lineRun
const leagues = require('../../leagues')

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
publicRouter.get('/', getRuns)

function getRuns(req, res) {
  const competition = req.query.competition || req.params.competition
  const league = req.query.league || req.params.league

  var selection = {}

  if (competition != null && competition.constructor === String) {
    selection.competition = competition
  } else if (Array.isArray(competition)) {
    selection.competition = {$in: competition.filter(ObjectId.isValid)}
  }

  if (league != null && league.constructor === String) {
    selection.league = league
  } else if (Array.isArray(league)) {
    selection.league = {$in: league}
  }

  var query = run.find(selection)

  //query.select("league competition round team field score time status started LoPs comment startTime")

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
module.exports.getRuns = getRuns

publicRouter.get('/latest', getLatestRun)

function getLatestRun(req, res) {
  const competition = req.query.competition || req.params.competition
  const league = req.query.league || req.params.league
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
module.exports.getLatestRun = getLatestRun

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

  const query = run.findById(id, "-__v")

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

  let model
  let scoreCalculator
  if (run.league != null) {
    if (leagues.isLeague(run.league)) {
      model = leagues.leagues[run.league].model
      scoreCalculator = leagues.leagues[run.league].scoreCalculator
    } else {
      const err = new Error('Invalid league "' + run.league + '"').message

      logger.error(err)

      return res.status(400).send({
        msg: "Error saving run in db",
        err: err.message
      })
    }
  }
  if (model == null) {
    model = baseModel
  }

  //logger.debug(run)

  run.findById(id).exec(function (err, dbRun) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get run",
        err: err.message
      })
    } else if (dbRun) {

      // Recursively updates properties in "dbObj" from "obj"
      const copyProperties = function (obj, dbObj, model) {
        for (let prop in obj) {
          if (obj.hasOwnProperty(prop)) {
            if (model.hasOwnProperty(prop)) {
              if (model.type == Object && obj[prop].constructor == Object) {
                copyProperties(obj[prop], dbObj[prop], model[prop].child)
              } else if (model.type == Array) {

                // Handle object with only numeric keys as "sparse" array
                if (obj[prop].constructor == Object &&
                    Object.keys(obj[prop]).every((key) => Number.isInteger(Number(key)))) {
                  const tmp = obj[prop]
                  obj[prop] = []
                  Object.keys(tmp).forEach(function (key) {
                    obj[prop][key] = tmp[key]
                  })
                }

                if (obj[prop].length > dbObj[prop].length &&
                    !model.extendable) {
                  return new Error(prop + " cannot be extended!")
                }

                Object.keys(obj[prop]).forEach(function (key) {
                  if (obj[prop][key] !== undefined) {
                    dbObj[prop][key] = obj[prop][key]
                  }
                })
              } else {
                dbObj[prop] = obj[prop]
              }

              if (dbObj.markModified !== undefined) {
                dbObj.markModified(prop)
              }
            }
          }
        }
      }

      err = copyProperties(run, dbRun, model)

      if (err) {
        logger.error(err)
        return res.status(400).send({
          err: err.message,
          msg: "Could not save run"
        })
      }

      if (scoreCalculator != null && scoreCalculator.constructor == Function) {
        dbRun.score = scoreCalculator(dbRun)
      }

      if (dbRun.score != 0 || dbRun.time.minutes != 0 ||
          dbRun.time.seconds != 0) {
        dbRun.started = true
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

  run.remove({
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

    let newRun
    if (run.league != null) {
      if (leagues.isLeague(run.league)) {
        newRun = leagues.leagues[run.league].create(run)
      } else {
        const err = new Error('Invalid league "' + run.league + '"').message

        logger.error(err)

        return res.status(400).send({
          msg: "Error saving run in db",
          err: err.message
        })
      }
    } else {
      newRun = new run({
        competition: run.competition,
        round      : run.round,
        team       : run.team,
        field      : run.field,
        startTime  : run.startTime
      })
    }

    newRun.save(function (err, data) {
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
  }
)


publicRouter.all('*', function (req, res, next) {
  next()
})
privateRouter.all('*', function (req, res, next) {
  next()
})

module.exports.public = publicRouter
module.exports.private = privateRouter
module.exports.admin = adminRouter
