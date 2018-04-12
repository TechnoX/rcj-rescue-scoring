"use strict"
const mongoose = require('mongoose')
const idValidator = require('mongoose-id-validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

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
teamSchema.index({competition: 1, league: 1, name: 1}, {unique: true})

teamSchema.pre('save', function (next) {
  const self = this
  if (self.isNew || self.isModified("name")) {
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

/**
 * Statics
 */
teamSchema.statics = {
  /**
   * Get team
   * @param {ObjectId} id - The objectId of team.
   * @returns {Promise<Team, Error>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((team) => {
        if (team) {
          return team
        }
        const err = new Error('No such team exists!')
        return Promise.reject(err)
      })
  }
}

teamSchema.plugin(idValidator)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const Team = module.exports = mongoose.model('Team', teamSchema)
