//========================================================================
//                          Libraries
//========================================================================

var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var competitiondb = require('../../models/competition')
var query = require('../../helper/query-helper')
var validator = require('validator')
var async = require('async')
var ObjectId = require('mongoose').Types.ObjectId
var logger = require('../../config/logger').mainLogger
var fs = require('fs')
//========================================================================
//                          /maps Api endpoints
//========================================================================


publicRouter.get('/', function (req, res) {
  query.doFindResultSortQuery(req, res, null, null, competitiondb.field)
})

publicRouter.get('/:fieldid', function (req, res, next) {
  var id = req.params.fieldid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  query.doIdQuery(req, res, id, "", competitiondb.field)
})

publicRouter.get('/:fieldid/runs', function (req, res, next) {
  var id = req.params.fieldid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.run.find({field: id}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get runs"})
    } else {
      res.status(200).send(data)
    }
  })
})

adminRouter.get('/:fieldid/delete', function (req, res, next) {
  var id = req.params.fieldid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.field.remove({_id: id}, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove field"})
    } else {
      res.status(200).send({msg: "Field has been removed!"})
    }
  })
})

adminRouter.post('/createfield', function (req, res) {
  var field = req.body

  var newField = new competitiondb.field({
    name       : field.name,
    competition: field.competition,
    league     : field.league
  })

  newField.save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving field"})
    } else {
      res.status(201).send({msg: "New field has been saved", id: data._id})
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