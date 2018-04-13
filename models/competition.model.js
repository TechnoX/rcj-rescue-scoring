"use strict"
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const idValidator = require('mongoose-id-validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

const competitionSchema = new Schema({
  name   : {type: String, required: true, unique: true, index: true},
  hidden : {type: Boolean, default: false},
  leagues: [{
    type: ObjectId,
    ref : 'League'
  }]
})

/**
 * Statics
 */
competitionSchema.statics = {
  /**
   * Get competition
   * @param {ObjectId} id - The objectId of competition.
   * @returns {Promise<Competition, Error>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((competition) => {
        if (competition) {
          return competition
        }
        const err = new Error('No such competition exists!')
        return Promise.reject(err)
      })
  },

  /**
   * List competitions
   * @param {Boolean} includeHidden - List all competitions, including hidden
   * @returns {Promise<[Competition], Error>}
   */
  list(includeHidden) {
    const query = includeHidden ? {} : {hidden: false}

    return this
      .find(query)
      .select("_id name")
      .lean()
      .exec()
  },
  
  /**
   *
   * @param {ObjectId} id - The objectId of competition.
   * @param {Object} data - Competition with updated data
   * @returns {Promise<Competition, Error>}
   */
  update(id, data) {
    return this.findById(id)
      .exec()
      .then((competition) => {
        if (competition) {
          competition.set(data)
          return competition.save()
        }
        const err = new Error('No such competition exists!')
        return Promise.reject(err)
      })
  },
  
  /**
   *
   * @param {ObjectId} id - The objectId of competition.
   * @returns {Promise<Competition, Error>}
   */
  remove(id) {
    return this.findByIdAndRemove(id)
      .exec()
      .then((competition) => {
        if (competition) {
          return competition
        }
        const err = new Error('No such competition exists!')
        return Promise.reject(err)
      })
  }
}

competitionSchema.plugin(idValidator)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const Competition = module.exports = mongoose.model('Competition', competitionSchema)