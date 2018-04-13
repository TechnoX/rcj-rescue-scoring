"use strict"
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const idValidator = require('mongoose-id-validator')
const Schema = mongoose.Schema

const logger = require('../config/logger').mainLogger

const leagueSchema = new Schema({
  name: {type: String, required: true, unique: true, index: true}
  // Todo: Here should be definition of which sub-models to use for map and run?
})

/**
 * Statics
 */
leagueSchema.statics = {
  /**
   * Get league
   * @param {ObjectId} id - The objectId of league.
   * @returns {Promise<League, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((league) => {
        if (league) {
          return league
        }
        const err = new Error('No such league exists!')
        return Promise.reject(err)
      })
  },
  
  /**
   * List leagues
   * @returns {Promise<[League], Error>}
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
   * @param {ObjectId} id - The objectId of league.
   * @param {Object} data - League with updated data
   * @returns {Promise<League, Error>}
   */
  update(id, data) {
    return this.findById(id)
      .exec()
      .then((league) => {
        if (league) {
          league.set(data)
          return league.save()
        }
        const err = new Error('No such league exists!')
        return Promise.reject(err)
      })
  },

  /**
   *
   * @param {ObjectId} id - The objectId of league.
   * @returns {Promise<League, Error>}
   */
  remove(id) {
    return this.findByIdAndRemove(id)
      .exec()
      .then((league) => {
        if (league) {
          return league
        }
        const err = new Error('No such league exists!')
        return Promise.reject(err)
      })
  }
}

leagueSchema.plugin(idValidator)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const League = module.exports = mongoose.model('League', leagueSchema)
