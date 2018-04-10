"use strict"
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const idValidator = require('mongoose-id-validator')
const Schema = mongoose.Schema

const logger = require('../config/logger').mainLogger

const leagueSchema = new Schema({
  name: {type: String, required: true, unique: true, index: true}
})

/**
 * Statics
 */
leagueSchema.statics = {
  /**
   * Get run
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
        const err = new APIError('No such competition exists!', httpStatus.NOT_FOUND)
        return Promise.reject(err)
      })
  }
}

leagueSchema.plugin(idValidator)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const League = module.exports = mongoose.model('League', leagueSchema)
