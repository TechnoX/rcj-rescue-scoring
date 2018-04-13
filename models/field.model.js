"use strict"
const mongoose = require('mongoose')
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
  league     : { // XXX: Should this be bound?
    type    : ObjectId,
    ref     : 'League',
    required: true,
    index   : true
  },
  name       : {type: String, required: true}
})
fieldSchema.index({competition: 1, league: 1})
fieldSchema.index({competition: 1, league: 1, name: 1}, {unique: true})

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

/**
 * Statics
 */
fieldSchema.statics = {
  /**
   * Get field
   * @param {ObjectId} id - The objectId of field.
   * @returns {Promise<Field, Error>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((field) => {
        if (field) {
          return field
        }
        const err = new Error('No such field exists!')
        return Promise.reject(err)
      })
  },
  
  /**
   * List fields
   * @returns {Promise<[Field], Error>}
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
   * @param {ObjectId} id - The objectId of field.
   * @param {Object} data - Field with updated data
   * @returns {Promise<Field, Error>}
   */
  update(id, data) {
    return this.findById(id)
      .exec()
      .then((field) => {
        if (field) {
          field.set(data)
          return field.save()
        }
        const err = new Error('No such field exists!')
        return Promise.reject(err)
      })
  },
  
  /**
   *
   * @param {ObjectId} id - The objectId of field.
   * @returns {Promise<Field, Error>}
   */
  remove(id) {
    return this.findByIdAndRemove(id)
      .exec()
      .then((field) => {
        if (field) {
          return field
        }
        const err = new Error('No such field exists!')
        return Promise.reject(err)
      })
  }
}

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const Field = module.exports.field = mongoose.model('Field', fieldSchema)
