"use strict"
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const idValidator = require('mongoose-id-validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

const competitionSchema = new Schema({
  name   : {type: String, required: true, unique: true, index: true},
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
   * Get run
   * @param {ObjectId} id - The objectId of competition.
   * @returns {Promise<Competition, APIError>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((competition) => {
        if (competition) {
          return competition
        }
        const err = new APIError('No such competition exists!', httpStatus.NOT_FOUND)
        return Promise.reject(err)
      })
  }
}

competitionSchema.plugin(idValidator)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const Competition = module.exports = mongoose.model('Competition', competitionSchema)