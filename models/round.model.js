"use strict"
const _ = require('underscore')
const mongoose = require('mongoose')
const idValidator = require('mongoose-id-validator')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

const leagues = require("./../leagues")

const roundSchema = new Schema({
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
roundSchema.index({competition: 1, league: 1})
roundSchema.index({competition: 1, league: 1, name: 1}, {unique: true})

roundSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Round.findOne({
      competition: self.competition,
      name       : self.name,
      league     : self.league
    }, function (err, dbRound) {
      if (err) {
        return next(err)
      } else if (dbRound) {
        err = new Error('Round with name "' + self.name + '" already exists!')
        return next(err)
      } else {
        return next()
      }
    })
  } else {
    return next()
  }
})

/**
 * Statics
 */
roundSchema.statics = {
  /**
   * Get round
   * @param {ObjectId} id - The objectId of round.
   * @returns {Promise<Round, Error>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((round) => {
        if (round) {
          return round
        }
        const err = new Error('No such round exists!')
        return Promise.reject(err)
      })
  },
  
  /**
   * List rounds
   * @returns {Promise<[Round], Error>}
   */
  list(query = {}) {
    return this
      .find(query)
      .select("_id name")
      .lean()
      .exec()
  },
  
  /**
   *
   * @param {ObjectId} id - The objectId of round.
   * @param {Object} data - Round with updated data
   * @returns {Promise<Round, Error>}
   */
  update(id, data) {
    return this.findById(id)
      .exec()
      .then((round) => {
        if (round) {
          round.set(data)
          return round.save()
        }
        const err = new Error('No such round exists!')
        return Promise.reject(err)
      })
  },
  
  /**
   *
   * @param {ObjectId} id - The objectId of round.
   * @returns {Promise<Round, Error>}
   */
  remove(id) {
    return this.findByIdAndRemove(id)
      .exec()
      .then((round) => {
        if (round) {
          return round
        }
        const err = new Error('No such round exists!')
        return Promise.reject(err)
      })
  }
}

roundSchema.plugin(idValidator)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const Round = module.exports = mongoose.model('Round', roundSchema)
