"use strict"
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../config/logger').mainLogger
const Team = require('../models/team.model')

const access = require('../helpers/accessLevels')
const ROLES = access.ROLES

module.exports.list = (req, res, next) => {
  let query = {}
  if (req.params.competitionId && ObjectId.isValid(req.params.competitionId)) {
    query.competition = req.params.competitionId
  }

  return Team.list(query)
    .then(dbTeams => {
      return res.status(200).json(dbTeams)
    }).catch(err => {
      return next(err)
    })
}

module.exports.get = (req, res, next) => {
  const id = req.params.teamId

  if (!ObjectId.isValid(id)) {
    return next()
  }

  return Team.get(id)
    .then(dbTeam => {
      return res.status(200).json(dbTeam)
    }).catch(err => {
      return next(err)
    })
}

module.exports.create = (req, res, next) => {
  //logger.debug(req.user)

  const team = req.body

  const role = access.getUserRole(req.user, {competition: team.competition})
  
  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }

  Team.create(team)
    .then((dbTeam) => {
      res.location("/api/teams/" + dbTeam._id)
      res.status(201).json({
        msg: "New team has been saved",
        id : dbTeam._id
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving team",
        err: err.message
      })
    })
}

module.exports.update = (req, res, next) => {
  const id = req.params.teamId

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const team = req.body

  // TODO: Fetch competition of team to check users access level
  const role = access.getUserRole(req.user)

  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }

  Team.update(id, team)
    .then((dbTeam) => {
      return res.status(200).json({
        msg : "Team has been saved!",
        data: dbTeam
      })
    })
    .catch((err) => {
      //logger.error(err)
      return res.status(400).json({
        msg: "Error saving team",
        err: err.message
      })
    })
}

module.exports.remove = (req, res, next) => {
  const id = req.params.teamId

  if (!ObjectId.isValid(id)) {
    return next()
  }

  // TODO: Fetch competition of team to check users access level
  const role = access.getUserRole(req.user)

  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }

  Team.remove(req.params.id)
    .then(() => {
      res.status(200).json({
        msg: "Team has been removed!"
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving team",
        err: err.message
      })
    })
}
