//========================================================================
//                          Libraries
//========================================================================

const express = require('express')
const privateRouter = express.Router()
const adminRouter = express.Router()
const competitiondb = require('../../models/competition')
const userdb = require('../../models/user')
const lineMapsApi = require('./lineMaps')
const lineRunsApi = require('./lineRuns')
const mazeMapsApi = require('./mazeMaps')
const mazeRunsApi = require('./mazeRuns')
const query = require('../../helper/query-helper')
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const auth = require('../../helper/authLevels')


const LINE_LEAGUES = competitiondb.LINE_LEAGUES
const MAZE_LEAGUES = competitiondb.MAZE_LEAGUES
const LEAGUES = competitiondb.LEAGUES

const ACCESSLEVELS = require('../../models/user').ACCESSLEVELS

const signagedb = competitiondb.signage

var socketIo

module.exports.connectSocketIo = function (io) {
  socketIo = io
}

privateRouter.get('/', function (req, res) {
    signagedb.find({}).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get signage data",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})

privateRouter.get('/:id', function (req, res, next) {
    var id = req.params.id
    if (!ObjectId.isValid(id)) {
        return next()
    }
    signagedb.findById(id).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get signage setting info",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})

privateRouter.get('/:id/refresh', function (req, res, next) {
    var id = req.params.id
    if (!ObjectId.isValid(id)) {
        return next()
    }
    if (socketIo !== undefined) {
      var date = new Date() ;
      logger.info(date)
      socketIo.sockets.in('signage/' + id).emit('time', date.getTime() + 5000)
      res.status(200).send(
          {
                msg: "Send refresh order",
                time: date.getTime() + 5000
          }
      )
      return
    }
    res.status(400).send({
                msg: "Socket server is now down"
            })
})

privateRouter.get('/:id/:cont', function (req, res, next) {
    var id = req.params.id
    if (!ObjectId.isValid(id)) {
        return next()
    }
    signagedb.findById(id)
        .select(req.params.cont)
        .exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get signage setting content",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})



adminRouter.post('/', function (req, res, next) {
  const sig = req.body
  
  new signagedb({
    name: sig.name,
    content: sig.content,
    news: sig.news
  }).save(function (err, data) {
    if (err) {
      logger.error(err)
      return res.status(400).send({
        msg: "Error saving signage setting in db",
        err: err.message
      })
    } else {
      //res.location("/api/runs/" + data._id)
      return res.status(201).send({
        err: "New run has been saved",
        id : data._id
      })
    }
  })
})


adminRouter.put('/:id', function (req, res, next) {
  const id = req.params.id
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  const sig = req.body
    
  signagedb.findById(id)
    .exec(function (err, dbSig) {
      if (err) {
        logger.error(err)
        res.status(400).send({
          msg: "Could not get signage",
          err: err.message
        })
      } else if (dbSig) {
        dbSig.name = sig.name
        dbSig.content = sig.content
        dbSig.news = sig.news
        
        dbSig.save(function (err) {
          if (err) {
            logger.error(err)
            return res.status(400).send({
              err: err.message,
              msg: "Could not save change"
            })
          } else {
            return res.status(200).send({
              msg  : "Saved change"
            })
          }
        })
      }
    })
})

adminRouter.delete('/:id', function (req, res, next) {
    var id = req.params.id

    if (!ObjectId.isValid(id)) {
        return next()
    }


    signagedb.deleteOne({
        _id: id
    }, function (err) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not remove signage setting",
                err: err.message
            })
        } else {
            res.status(200).send({
                msg: "Signage setting has been removed!"
            })
        }
    })
})


privateRouter.all('*', function (req, res, next) {
    next()
})
adminRouter.all('*', function (req, res, next) {
    next()
})

module.exports.private = privateRouter
module.exports.admin = adminRouter
