"use strict"
const glob = require('glob-fs')()
const requireGlob = require('require-glob')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../config/logger').mainLogger
const Map = require('../models/map.model')

const access = require('../helpers/accessLevels')
const ROLES = access.ROLES

/*
 let mapModels = glob.readdirSync(
 '*.map.model.js',
 {cwd: __dirname + '/../models/'}
 )
 const TYPES = module.exports.TYPES = mapModels.map(filename => filename.replace('.map.model.js', ''))
 */

const typeModels = requireGlob.sync('../models/*.map.model.js')

module.exports.get = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  return Map.get(id)
    .then(dbMap => {
      return res.status(200).send(dbMap)
    }).catch(err => {
      return next(err)
    })
}

module.exports.create = (req, res, next) => {
  //logger.debug(req.user)

  const map = req.body
  const role = access.getUserRole(req.user, {competition: map.competition})
  
  if (access.isLt(role, ROLES.ADMIN)) {
    return res.status(401).send({msg: "Unauthorized"})
  }

  let mapModel
  if (map.type) {
    mapModel = typeModels[map.type.toLowerCase() + "MapModel"]
    if (mapModel == null) {
      return res.status(400).send({
        msg: "Error saving map",
        err: "Invalid map type: " + map.type
      })
    }
  } else {
    mapModel = Map
  }

  mapModel.create(map)
    .then((dbMap) => {
      res.location("/api/maps/" + dbMap._id)
      res.status(201).send({
        msg: "New map has been saved",
        id : dbMap._id
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).send({
        msg: "Error saving map",
        err: err.message
      })
    })
}

module.exports.update = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const map = req.body

  // Not guaranteed map.competition is sent in, should fetch from db then?
  const role = access.getUserRole(req.user, {competition: map.competition})
  
  if (access.isGte(role, ROLES.ADMIN)) {
    Map.update(map)
      .then((dbMap) => {
        res.status(200).send({
          msg: "Map has been saved!"
        })
      })
      .catch((err) => {
        //logger.error(err)
        res.status(400).send({
          msg: "Error saving map",
          err: err.message
        })
      })
  } else {
    return res.status(401).send({msg: "Unauthorized"})
  }
}

module.exports.remove = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const role = access.getUserRole(req.user)

  if (access.isGte(role, ROLES.ADMIN)) {
    Map.remove(req.params.id)
      .then(() => {
        res.status(200).send({
          msg: "Map has been removed!"
        })
      })
      .catch((err) => {
        //logger.error(err)
        res.status(400).send({
          msg: "Error saving map",
          err: err.message
        })
      })
  } else {
    // TODO: Fetch map and check if user roles match competition
    return res.status(401).send({msg: "Unauthorized"})
  }
}
