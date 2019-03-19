"use strict"
const mongoose = require('mongoose')
const mongooseInteger = require('mongoose-integer')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

/**
 *
 *@constructor
 *
 * @param {String} username - The username
 * @param {String} password - The password
 * @param {String} salt - The salt used, unique for every user
 * @param {Boolean} admin - If the user is admin or not
 */
const mapSchema = new Schema({
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  name       : {type: String, required: true},
  finished   : {type: Boolean, default: false}
})

mapSchema.pre('save', function (next) {
  var self = this

  if (self.isNew || self.isModified("name")) {
    Map.findOne({
      competition: self.competition,
      name       : self.name
    }).populate("competition", "name").exec(function (err, dbMap) {
      if (err) {
        return next(err)
      } else if (dbMap) {
        err = new Error('Map "' + dbMap.name +
                        '" already exists in competition "' +
                        dbMap.competition.name + '"!')
        return next(err)
      } else {
        return next()
      }
    })
  }
})

mapSchema.plugin(mongooseInteger)

const Map = mongoose.model('Map', mapSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.map = Map
