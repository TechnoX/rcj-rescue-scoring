"use strict"
const mongoose = require('mongoose')
const mongooseInteger = require('mongoose-integer')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const logger = require('../../config/logger').mainLogger

const tileSetSchema = new Schema({
  name : {type: String, required: true, unique: true},
  tiles: [{
    tileType: {type: ObjectId, ref: 'TileType', required: true},
    count   : {type: Number, integer: true, default: 1}
  }]
})

tileSetSchema.plugin(mongooseInteger)

const TileSet = mongoose.model('TileSet', tileSetSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.tileSet = TileSet
