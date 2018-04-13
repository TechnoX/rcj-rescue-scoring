"use strict"
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../config/logger').mainLogger
const Field = require('../models/field.model')

const access = require('../helpers/accessLevels')
const ROLES = access.ROLES

module.exports.list = (req, res, next) => {
  let query = {}
  if (req.params.competitionId && ObjectId.isValid(req.params.competitionId)) {
    query.competition = req.params.competitionId
  }
  
  return Field.list(query)
    .then(dbFields => {
      return res.status(200).json(dbFields)
    }).catch(err => {
      return next(err)
    })
}

module.exports.get = (req, res, next) => {
  const id = req.params.fieldId
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  return Field.get(id)
    .then(dbField => {
      return res.status(200).json(dbField)
    }).catch(err => {
      return next(err)
    })
}

module.exports.create = (req, res, next) => {
  //logger.debug(req.user)
  
  const field = req.body
  
  const role = access.getUserRole(req.user, {competition: field.competition})
  
  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }
  
  Field.create(field)
    .then((dbField) => {
      res.location("/api/fields/" + dbField._id)
      res.status(201).json({
        msg: "New field has been saved",
        id : dbField._id
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving field",
        err: err.message
      })
    })
}

module.exports.update = (req, res, next) => {
  const id = req.params.fieldId
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  const field = req.body
  
  // TODO: Fetch competition of field to check users access level
  const role = access.getUserRole(req.user)
  
  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }
  
  Field.update(id, field)
    .then((dbField) => {
      return res.status(200).json({
        msg : "Field has been saved!",
        data: dbField
      })
    })
    .catch((err) => {
      //logger.error(err)
      return res.status(400).json({
        msg: "Error saving field",
        err: err.message
      })
    })
}

module.exports.remove = (req, res, next) => {
  const id = req.params.fieldId
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  // TODO: Fetch competition of field to check users access level
  const role = access.getUserRole(req.user)
  
  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).json({msg: "Unauthorized"})
  }
  
  Field.remove(req.params.id)
    .then(() => {
      res.status(200).json({
        msg: "Field has been removed!"
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving field",
        err: err.message
      })
    })
}
