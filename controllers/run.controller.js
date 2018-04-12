"use strict"
const glob = require('glob-fs')()
const requireGlob = require('require-glob')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../config/logger').mainLogger
const Run = require('../models/run.model')

const access = require('../helpers/accessLevels')
const ROLES = access.ROLES

/*
 let runModels = glob.readdirSync(
 '*.run.model.js',
 {cwd: __dirname + '/../models/'}
 )
 const TYPES = module.exports.TYPES = runModels.run(filename => filename.replace('.run.model.js', ''))
 */

const typeModels = requireGlob.sync('../models/*.run.model.js')


module.exports.get = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  return Run.get(id)
    .then(dbRun => {
      return res.status(200).json(dbRun)
    }).catch(err => {
      return next(err)
    })
}

module.exports.create = (req, res, next) => {
  //logger.debug(req.user)

  const run = req.body
  const role = access.getUserRole(req.user, {competition: run.competition})

  if (access.isLt(role, ROLES.MAINJUDGE)) {
    return res.status(401).json({msg: "Unauthorized"})
  }

  let runModel
  if (run.type) {
    runModel = typeModels[run.type.toLowerCase() + "RunModel"]
    if (runModel == null) {
      return res.status(400).json({
        msg: "Error saving run",
        err: "Invalid run type: " + run.type
      })
    }
  } else {
    runModel = Run
  }

  runModel.create(run)
    .then((dbRun) => {
      res.location("/api/runs/" + dbRun._id)
      res.status(201).json({
        msg: "New run has been saved",
        id : dbRun._id
      })
    })
    .catch((err) => {
      //logger.error(err)
      res.status(400).json({
        msg: "Error saving run",
        err: err.message
      })
    })
}

module.exports.update = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const run = req.body

  // Not guaranteed run.competition is sent in, should fetch from db then?
  const role = access.getUserRole(req.user, {competition: run.competition})

  if (access.isGte(role, ROLES.JUDGE)) {
    Run.update(id, run)
      .then((dbRun) => {
        return res.status(200).json({
          msg: "Run has been saved!",
          data: dbRun
        })
      })
      .catch((err) => {
        //logger.error(err)
        return res.status(400).json({
          msg: "Error saving run",
          err: err.message
        })
      })
  } else {
    return res.status(401).json({msg: "Unauthorized"})
  }
}

module.exports.remove = (req, res, next) => {
  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return next()
  }

  const role = access.getUserRole(req.user)

  if (access.isGte(role, ROLES.MAINJUDGE)) {
    Run.remove(req.params.id)
      .then(() => {
        res.status(200).json({
          msg: "Run has been removed!"
        })
      })
      .catch((err) => {
        //logger.error(err)
        res.status(400).json({
          msg: "Error saving run",
          err: err.message
        })
      })
  } else {
    // TODO: Fetch run and check if user roles match competition
    return res.status(401).json({msg: "Unauthorized"})
  }
}
