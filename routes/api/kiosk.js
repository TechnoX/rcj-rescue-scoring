//========================================================================
//                          Libraries
//========================================================================

const express = require('express')
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

adminRouter.get('/:kioskNum/NA', function (req, res) {
    var num = req.params.kioskNum

    if (socketIo !== undefined) {
      socketIo.sockets.in('kiosk/' + num).emit('show', false)
      res.status(200).send(
          {
                msg: "Send Order",
                show: false
          }
      )
      return
    }
    res.status(400).send({
                msg: "Socket server is now down"
            })
})


adminRouter.get('/:kioskNum/line_checkpoint/:runId', function (req, res) {
    var num = req.params.kioskNum
    var id = req.params.runId
    if (!ObjectId.isValid(id)) {
        return next()
    }
    var url = "/line/checkpoint/" + id
    if (socketIo !== undefined) {
      socketIo.sockets.in('kiosk/' + num).emit('url', url)
      socketIo.sockets.in('kiosk/' + num).emit('show', true)
      res.status(200).send(
          {
                msg: "Send Order",
                url: url,
                show: true
          }
      )
      return
    }
    res.status(400).send({
                msg: "Socket server is now down"
            })
})


adminRouter.get('/:kioskNum/run/line/:compe/:team', function (req, res) {
    var num = req.params.kioskNum
    var compe = req.params.compe
    var team = req.params.team
    if (!ObjectId.isValid(compe)) {
        return next()
    }
    if (!ObjectId.isValid(team)) {
        return next()
    }
    var url = "/admin/"+compe+"/line/apteam/"+team
    if (socketIo !== undefined) {
      socketIo.sockets.in('kiosk/' + num).emit('url', url)
      socketIo.sockets.in('kiosk/' + num).emit('show', true)
      res.status(200).send(
          {
                msg: "Send Order",
                url: url,
                show: true
          }
      )
      return
    }
    res.status(400).send({
                msg: "Socket server is now down"
            })
})


adminRouter.get('/:kioskNum/run/maze/:compe/:team', function (req, res) {
    var num = req.params.kioskNum
    var compe = req.params.compe
    var team = req.params.team
    if (!ObjectId.isValid(compe)) {
        return next()
    }
    if (!ObjectId.isValid(team)) {
        return next()
    }
    var url = "/admin/"+compe+"/maze/apteam/"+team
    if (socketIo !== undefined) {
      socketIo.sockets.in('kiosk/' + num).emit('url', url)
      socketIo.sockets.in('kiosk/' + num).emit('show', true)
      res.status(200).send(
          {
                msg: "Send Order",
                url: url,
                show: true
          }
      )
      return
    }
    res.status(400).send({
                msg: "Socket server is now down"
            })
})







adminRouter.all('*', function (req, res, next) {
    next()
})

module.exports.admin = adminRouter
