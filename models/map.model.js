"use strict"
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const idValidator = require('mongoose-id-validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const httpStatus = require('http-status')
const APIError = require('../helpers/APIError')

const logger = require('../config/logger').mainLogger

const Competition = require('./competition.model') // XXX: Temporary
const League = require('./league.model') // XXX: Temporary

const mapSchema = new Schema({
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
  name       : {type: String, trim: true, required: true},
  finished   : {type: Boolean, default: false}
})
mapSchema.index({competition: 1, league: 1})
mapSchema.index({competition: 1, league: 1, name: 1}, {unique: true})

mapSchema.pre('save', function (next) {
  var self = this

  // TODO: Don't allow changes if map is used in started runs

  if (self.isNew || self.isModified("name")) {
    Map.findOne({
      competition: self.competition,
      league     : self.league,
      name       : self.name
    })
      .populate([
        {path: 'competition', select: 'name'},
        {path: 'league', select: 'name'}
      ])
      .exec()
      .then((dbMap) => {
        if (dbMap) {
          const err = new Error(
            'Map "' + dbMap.name +
            '" already exists in league "' + dbMap.league.name +
            '" in competition "' + dbMap.competition.name + '"!'
          )
          return Promise.reject(err)
        }
        return next()
      })
      .catch((err) => {
        return next(err)
      })
  }
})

/**
 * Statics
 */
mapSchema.statics = {
  /**
   * Get run
   * @param {ObjectId} id - The objectId of map.
   * @returns {Promise<Map, Error>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((map) => {
        if (map) {
          return map
        }
        const err = new Error('No such map exists!')
        return Promise.reject(err)
      })
  },

  /**
   *
   * @param {ObjectId} id - The objectId of map.
   * @param {Object} data - Map with updated data
   * @returns {Promise<Map, Error>}
   */
  update(id, data) {
    // Select only _id property as we are only interested in getting a mongoose object
    return this.findById(id, "_id")
      .exec()
      .then((map) => {
        if (map) {
          let filteredData = map.updateFilter(data)
          map.set(filteredData)
          return map.save()
        }
        const err = new Error('No such map exists!')
        return Promise.reject(err)
      })
  },

  /**
   *
   * @param {ObjectId} id - The objectId of map.
   * @returns {Promise<Map, Error>}
   */
  remove(id) {
    return this.findByIdAndRemove(id)
      .exec()
      .then((map) => {
        if (map) {
          return map
        }
        const err = new Error('No such map exists!')
        return Promise.reject(err)
      })
  }
}

mapSchema.methods = {
  updateFilter(data) {
    let filteredData = {
      name    : data.name,
      finished: data.finished
    }

    // Stringify and parse to remove undefined properties
    return JSON.parse(JSON.stringify(filteredData))
  }
}

mapSchema.plugin(idValidator)

const Map = module.exports = mongoose.model('Map', mapSchema)