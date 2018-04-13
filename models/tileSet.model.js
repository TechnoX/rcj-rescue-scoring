"use strict"
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../../config/logger').mainLogger

const tileSetSchema = new Schema({
  name : {type: String, required: true, unique: true},
  tiles: [{
    tileType: {type: ObjectId, ref: 'TileType', required: true},
    count   : {type: Number, integer: true, default: 1}
  }]
})

/**
 * Statics
 */
tileSetSchema.statics = {
  /**
   * Get tileSet
   * @param {ObjectId} id - The objectId of tileSet.
   * @returns {Promise<TileSet, Error>}
   */
  get(id) {
    return this.findById(id)
      .exec()
      .then((tileSet) => {
        if (tileSet) {
          return tileSet
        }
        const err = new Error('No such tile set exists!')
        return Promise.reject(err)
      })
  },
  
  /**
   * List tileSets
   * @returns {Promise<[TileSet], Error>}
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
   * @param {ObjectId} id - The objectId of tileSet.
   * @param {Object} data - TileSet with updated data
   * @returns {Promise<TileSet, Error>}
   */
  update(id, data) {
    return this.findById(id)
      .exec()
      .then((tileSet) => {
        if (tileSet) {
          tileSet.set(data)
          return tileSet.save()
        }
        const err = new Error('No such tile set exists!')
        return Promise.reject(err)
      })
  },
  
  /**
   *
   * @param {ObjectId} id - The objectId of tileSet.
   * @returns {Promise<TileSet, Error>}
   */
  remove(id) {
    return this.findByIdAndRemove(id)
      .exec()
      .then((tileSet) => {
        if (tileSet) {
          return tileSet
        }
        const err = new Error('No such tile set exists!')
        return Promise.reject(err)
      })
  }
}

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const TileSet = module.exports = mongoose.model('TileSet', tileSetSchema)

