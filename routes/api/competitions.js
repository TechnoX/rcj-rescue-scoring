//========================================================================
//                          Libraries
//========================================================================

const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const competitiondb = require('../../models/competition')
const lineMapsApi = require('./lineMaps')
const lineRunsApi = require('./lineRuns')
const query = require('../../helper/query-helper')
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')

const LINE_LEAGUES = competitiondb.LINE_LEAGUES
const MAZE_LEAGUES = competitiondb.MAZE_LEAGUES
const LEAGUES = competitiondb.LEAGUES

publicRouter.get('/', function (req, res) {
  competitiondb.competition.find({}).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get competitions"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competition', function (req, res, next) {
  const id = req.params.competition

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.competition.findById(id).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get competition"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competition/teams', function (req, res, next) {
  const id = req.params.competition

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.team.find({competition: id}).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get teams"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competition/:league/teams', function (req, res, next) {
  const id = req.params.competition
  const league = req.params.league

  if (!ObjectId.isValid(id)) {
    return next()
  }

  if (LEAGUES.indexOf(league) == -1) {
    return next()
  }

  competitiondb.team.find({
    competition: id,
    league     : league
  }).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get teams"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competition/line/runs', function (req, res, next) {
  var id = req.params.competition

  if (!ObjectId.isValid(id)) {
    return next()
  }
  return lineRunsApi.getLineRuns(req, res, next)
})

publicRouter.get('/:competition/:league/maps', function (req, res, next) {
  const id = req.params.competition
  const league = req.params.league

  if (!ObjectId.isValid(id)) {
    return next()
  }

  if (LINE_LEAGUES.indexOf(league) != -1) {
    return lineMapsApi.getLineMaps(req, res, next)
  }

  if (MAZE_LEAGUES.indexOf(league) != -1) {
    //return lineMapsApi.getLineMaps(req, res, next)
  }

  return next()
})
publicRouter.get('/:competition/line/maps', function (req, res, next) {
  const id = req.params.competition

  if (!ObjectId.isValid(id)) {
    return next()
  }

  return lineMapsApi.getLineMaps(req, res, next)
})

publicRouter.get('/:competition/fields', function (req, res, next) {
  var id = req.params.competition

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.field.find({competition: id}).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get fields"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competition/:league/fields', function (req, res, next) {
  const id = req.params.competition
  const league = req.params.league

  if (!ObjectId.isValid(id)) {
    return next()
  }

  if (LEAGUES.indexOf(league) == -1) {
    return next()
  }

  competitiondb.field.find({
    competition: id,
    league     : league
  }).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get fields"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competition/rounds', function (req, res, next) {
  var id = req.params.competition

  if (!ObjectId.isValid(id)) {
    return next()
  }

  competitiondb.round.find({competition: id}).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get rounds"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competition/:league/rounds', function (req, res, next) {
  var id = req.params.competition
  const league = req.params.league

  if (!ObjectId.isValid(id)) {
    return next()
  }

  if (LEAGUES.indexOf(league) == -1) {
    return next()
  }

  competitiondb.round.find({
    competition: id,
    league     : league
  }).lean().exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get rounds"})
    } else {
      res.status(200).send(data)
    }
  })
})

adminRouter.post('/', function (req, res) {
  const competition = req.body

  new competitiondb.competition({
    name: competition.name
  }).save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving competition"})
    } else {
      res.location("/api/competitions/" + data._id)
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