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



publicRouter.get('/', function (req, res) {
  query.doFindResultSortQuery(req, res, null, null, competitiondb.competition)
})

publicRouter.get('/:competitionid', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  query.doIdQuery(req, res, id, "", competitiondb.competition)
})

publicRouter.get('/:competitionid/delete', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.competition.remove({_id: id}, function (err) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not remove competition"})
    } else {
      res.status(200).send({msg: "Competition has been removed!"})
    }
  })
})

publicRouter.get('/:competitionid/teams', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.team.find({competition: id}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get teams"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competitionid/teams/:name', function (req, res, next) {
  var id = req.params.competitionid
  var name = req.params.name

  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  competitiondb.team.find({"competition": id , "name": name}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get teams"})
    } else {
      res.status(200).send(data)
    }
  })
})


publicRouter.get('/:competitionid/runs', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  var populate
  if (req.query['populate'] !== undefined && req.query['populate']) {
    populate = ["round", "team", "field", "competition", {path: 'tiles', populate: {path: 'tileType'}}]
  }

  var query = competitiondb.run.find({competition: id}, "round team field competition score time rescuedLiveVictims rescuedDeadVictims LoPs status retired")
  if (populate !== undefined) {
    query.populate(populate)
  }
  query.exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get runs"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competitionid/runs/:field/:status', function (req, res, next) {
  var id = req.params.competitionid
  var field_id = req.params.field
  var status = req.params.status
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if (!ObjectId.isValid(field_id)) {
    return next()
  }
  populate = ["team"]
  var query = competitiondb.run.find({competition: id , field: field_id , status: status}, "field team competition status")
  query.populate(populate)
  query.exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get runs"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competitionid/fields', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.field.find({competition: id}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get fields"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competitionid/fields/:name', function (req, res, next) {
  var id = req.params.competitionid
  var name = req.params.name

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.field.find({competition: id , name: name}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get fields"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competitionid/rounds', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.round.find({competition: id}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get rounds"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competitionid/rounds/:name', function (req, res, next) {
  var id = req.params.competitionid
  var name = req.params.name

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.round.find({competition: id , name: name}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get rounds"})
    } else {
      res.status(200).send(data)
    }
  })
})

adminRouter.post('/createcompetition', function (req, res) {
  var competition = req.body

  var newCompetition = new competitiondb.competition({
    name: competition.name
  })

  newCompetition.save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving competition"})
    } else {
      res.status(201).send({
        msg: "New competition has been saved",
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