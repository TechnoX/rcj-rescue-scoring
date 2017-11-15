"use strict"
const _ = require('underscore')
const mongoose = require('mongoose')
const idValidator = require('mongoose-id-validator')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

const fieldSchema = new Schema({
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  league     : {
    type    : ObjectId,
    ref     : 'League',
    required: true,
    index   : true
  },
  name       : {type: String, required: true}
})
fieldSchema.index({competition: 1, league: 1})

fieldSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Field.findOne({
      competition: self.competition,
      league     : self.league,
      name       : self.name
    }, function (err, dbField) {
      if (err) {
        next(err)
      } else if (dbField) {
        err = new Error('Field with name "' + self.name + '" already exists!')
        next(err)
      } else {
        next()
      }
    })
  } else {
    next()
  }
})

fieldSchema.plugin(idValidator)

const Field = mongoose.model('Field', fieldSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.field = Field
