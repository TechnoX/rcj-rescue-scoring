"use strict"
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const lineRun = require('../../models/lineRun').lineRun
const competitiondb = require('../../models/competition')
const mapdb = require('../../models/lineMap')
const query = require('../../helper/query-helper')
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const pathFinder = require('../../helper/pathFinder')
const scoreCalculator = require('../../helper/scoreCalculator')

var socketIo

module.exports.connectSocketIo = function (io) {
  socketIo = io
}

publicRouter.get('/', function (req, res) {
  lineRun.find({}).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get runs"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:runid', function (req, res, next) {
  var id = req.params.runid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  var populate
  if (req.query['populate'] !== undefined && req.query['populate']) {
    populate = ["round", "team", "field", "competition", {
      path    : 'tiles',
      populate: {path: 'tileType'}
    }]
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

privateRouter.put('/:runid', function (req, res, next) {
  const id = req.params.runid
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  const run = req.body

  lineRun.findById(id, function (err, dbRun) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get run"})
    } else {

      if (!Array.isArray(run.tiles) && typeof run.tiles == 'object') { // Handle object as "sparse" array
        const tiles = run.tiles
        run.tiles = []
        Object.keys(tiles).forEach(function (key) {
          if (!isNaN(key)) {
            run.tiles[key] = tiles[key]
          }
        })
      }

      // Recursively updates properties in "dbObj" from "obj"
      const copyProperties = function (obj, dbObj) {
        for (let prop in obj) {
          if (obj.hasOwnProperty(prop) && dbObj.hasOwnProperty(prop) || dbObj.get(prop) !== undefined) {
            if (typeof obj[prop] == 'object') {
              return copyProperties(obj[prop], dbObj[prop])
            } else if (obj[prop] !== undefined) {
              dbObj[prop] = obj[prop]
            }
          } else {
            return new Error("Illegal key: " + prop)
          }
        }
      }

      let err = copyProperties(run, dbRun)

      if (err) {
        logger.error(err)
        res.status(400).send({err: err, msg: "Could not save run"})
      }
      
      dbRun.score = scoreCalculator.calculateScore(dbRun)

      dbRun.save(function (err) {
        if (err) {
          logger.error(err)
          res.status(400).send({err: err, msg: "Could not save run"})
        } else {
          if (socketIo !== undefined) {
            socketIo.sockets.in('runs/').emit('changed')
            socketIo.sockets.in('runs/' + dbRun._id).emit('data', dbRun)
            socketIo.sockets.in('fields/' +
                                dbRun.field).emit('data', {newRun: dbRun._id})
          }
          res.status(200).send({msg: "Saved run", score: dbRun.score})
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
 * @apiParam {String} runid The competition id
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
  
  lineRun.remove({_id: id}, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({err: "Could not remove run"})
    } else {
      res.status(200).send({msg: "Run has been removed!"})
    }
  })
})

/**
 * @api {post} /runs/line/createrun Create new run
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
    map        : run.map
  }).save(function (err, data) {
    if (err) {
      logger.error(err)
      return res.status(400).send({msg: "Error saving run in db"})
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
