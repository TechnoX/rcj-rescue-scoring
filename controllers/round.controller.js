"use strict"
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../config/logger').mainLogger
const Round = require('../models/round.model')

const access = require('../helpers/accessLevels')
const ROLES = access.ROLES

module.exports.list = (req, res, next) => {
  let query = {}
  if (req.params.competitionId && ObjectId.isValid(req.params.competitionId)) {
    query.competition = req.params.competitionId
  }
  
  return Round.list(query)
    .then(dbRounds => {
      return res.status(200).json(dbRounds)
    }).catch(err => {
      return next(err)
    })
}

module.exports.get = (req, res, next) => {
  const id = req.params.roundId
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  return Round.get(id)
    .then(dbRound => {
      return res.status(200).json(dbRound)
    }).catch(err => {
      return next(err)
    })
}

module.exports.create = (req, res, next) => {
  //logger.debug(req.user)
  
  const round = req.body
  
  const role = access.getUserRole(req.user, {competition: round.competition})
  
  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }
  
  Round.create(round)
    .then((dbRound) => {
      res.location("/api/rounds/" + dbRound._id)
      res.status(201).json({
        msg: "New round has been saved",
        id : dbRound._id
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving round",
        err: err.message
      })
    })
}

module.exports.update = (req, res, next) => {
  const id = req.params.roundId
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  const round = req.body
  
  // TODO: Fetch competition of round to check users access level
  const role = access.getUserRole(req.user)
  
  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }
  
  Round.update(id, round)
    .then((dbRound) => {
      return res.status(200).json({
        msg : "Round has been saved!",
        data: dbRound
      })
    })
    .catch((err) => {
      //logger.error(err)
      return res.status(400).json({
        msg: "Error saving round",
        err: err.message
      })
    })
}

module.exports.remove = (req, res, next) => {
  const id = req.params.roundId
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  // TODO: Fetch competition of round to check users access level
  const role = access.getUserRole(req.user)
  
  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }
  
  Round.remove(req.params.id)
    .then(() => {
      res.status(200).json({
        msg: "Round has been removed!"
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving round",
        err: err.message
      })
    })
}
