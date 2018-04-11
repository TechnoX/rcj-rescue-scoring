"use strict"
const logger = require('../config/logger').mainLogger
const Map = require('../models/map.model')

module.exports.load = (params) => {
  return Map.get(params.id)
}

module.exports.get = (req, res, next) => {
  return this.load(req.params)
    .then(run => {
      return res.status(200).send(run)
    }).catch(err => {
      return next(err)
    })
}

module.exports.create = (req, res, next) => {
  logger.debug(req.user)
  //mongoose.model(req.params.type)
  new Map(req.body)
    .save()
    .then((map) => {
      res.location("/api/maps/" + map._id)
      res.status(201).send({
        msg: "New map has been saved",
        id : map._id
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

module.exports.update = (params) => {
  return this.load(params).then(run => {
    run.title = params.data.title
    run.content = params.data.content
    return run.save()
  })
}

module.exports.list = (params) => {
  const {limit = 50, skip = 0} = params;
  return Map.list({limit, skip})
}

module.exports.remove = (params) => {
  return this.load(params).then(post => post.remove())
}
