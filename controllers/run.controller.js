"use strict"
const Run = require('../models/run.model')

module.exports.load = (params) => {
  return Run.get(params.id)
}

module.exports.get = (req, res, next) => {
  return this.load(req.params)
    .then(run => {
      return res.status(200).send(run)
    }).catch(err => {
      return next(err)
    })
}

module.exports.create = (params) => {
  const run = new Run({
    title  : params.data.title,
    content: params.data.content
  })
  return run.save()
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
  return Run.list({limit, skip})
}

module.exports.remove = (params) => {
  return this.load(params).then(post => post.remove())
}
