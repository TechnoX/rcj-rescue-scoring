//========================================================================
//                          Libraries
//========================================================================

const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const competitiondb = require('../../models/competition')
const lineRundb = require('../../models/lineRun')
const lineMapdb = require('../../models/lineMap')
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
  competitiondb.competition.find({}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get competitions"})
    } else {
      res.status(200).send(data)
    }
  })
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
  const id = req.params.competitionid

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

publicRouter.get('/:competitionid/:league/teams', function (req, res, next) {
  const id = req.params.competitionid
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
  }, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get teams"})
    } else {
      res.status(200).send(data)
    }
  })
})

publicRouter.get('/:competitionid/line/runs', function (req, res, next) {
  var id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  var populate
  if (req.query['populate'] !== undefined && req.query['populate']) {
    populate = ["round", "team", "field", "competition"/*, {path: 'tiles', populate: {path: 'tileType'}}*/]
  }

  const query = lineRundb.lineRun.find({competition: id}, "round team field competition score time")
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
publicRouter.get('/:competitionid/:league/maps', function (req, res, next) {
  const id = req.params.competitionid
  const league = req.params.league

  if (!ObjectId.isValid(id)) {
    return next()
  }

  if (LINE_LEAGUES.indexOf(league) != -1) {
    return getLineMaps(req, res, next)
  }

  return next()
})
publicRouter.get('/:competitionid/line/maps', getLineMaps)

function getLineMaps(req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  var populate
  if (req.query['populate'] !== undefined && req.query['populate']) {
    populate = {path: 'tiles', populate: {path: 'tileType'}}
  }

  const query = lineMapdb.lineMap.find({competition: id})
  if (populate !== undefined) {
    query.populate(populate)
  }
  query.exec(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get maps"})
    } else {
      res.status(200).send(data)
    }
  })
}

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

publicRouter.get('/:competitionid/:league/fields', function (req, res, next) {
  const id = req.params.competitionid
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
  }, function (err, data) {
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

publicRouter.get('/:competitionid/:league/rounds', function (req, res, next) {
  var id = req.params.competitionid
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
  }, function (err, data) {
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