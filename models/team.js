"use strict"
const _ = require('underscore')
const mongoose = require('mongoose')
const idValidator = require('mongoose-id-validator')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

const leagues = require("./../leagues")

const teamSchema = new Schema({
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
teamSchema.index({competition: 1, league: 1})

teamSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Team.findOne({
      competition: self.competition,
      name       : self.name,
      league     : self.league
    }, function (err, dbTeam) {
      if (err) {
        next(err)
      } else if (dbTeam) {
        err = new Error('Team with name "' + self.name + '" already exists!')
        next(err)
      } else {
        next()
      }
    })
  } else {
    next()
  }
})

teamSchema.plugin(idValidator)

const Team = mongoose.model('Team', teamSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.team = Team
