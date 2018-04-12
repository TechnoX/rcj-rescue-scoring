"use strict"
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../config/logger').mainLogger
const Competition = require('../models/competition.model')

const access = require('../helpers/accessLevels')
const ROLES = access.ROLES

module.exports.list = (req, res, next) => {
  return Competition.list(req.user)
    .then(dbComps => {
      return res.status(200).json(dbComps)
    }).catch(err => {
      return next(err)
    })
}

module.exports.get = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  return Competition.get(id)
    .then(dbComp => {
      return res.status(200).json(dbComp)
    }).catch(err => {
      return next(err)
    })
}

module.exports.create = (req, res, next) => {
  //logger.debug(req.user)

  const competition = req.body

  const role = access.getUserRole(req.user)
  
  if (access.isLt(role, ROLES.SUPERADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }

  Competition.create(competition)
    .then((dbComp) => {
      res.location("/api/competitions/" + dbComp._id)
      res.status(201).json({
        msg: "New competition has been saved",
        id : dbComp._id
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving competition",
        err: err.message
      })
    })
}

module.exports.update = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const competition = req.body

  const role = access.getUserRole(req.user, {competition: id})

  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }

  Competition.update(id, competition)
    .then((dbComp) => {
      return res.status(200).json({
        msg : "Competition has been saved!",
        data: dbComp
      })
    })
    .catch((err) => {
      //logger.error(err)
      return res.status(400).json({
        msg: "Error saving competition",
        err: err.message
      })
    })
}

module.exports.remove = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const role = access.getUserRole(req.user)

  if (access.isLt(role, ROLES.SUPERADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }

  Competition.remove(req.params.id)
    .then(() => {
      res.status(200).json({
        msg: "Competition has been removed!"
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving competition",
        err: err.message
      })
    })
}
