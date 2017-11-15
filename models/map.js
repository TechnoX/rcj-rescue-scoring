"use strict"
const mongoose = require('mongoose')
const mongooseInteger = require('mongoose-integer')
const idValidator = require('mongoose-id-validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

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
  name       : {type: String, required: true},
  finished   : {type: Boolean, default: false}
})
mapSchema.index({competition: 1, league: 1})

mapSchema.pre('save', function (next) {
  var self = this

  if (self.isNew || self.isModified("name")) {
    Map.findOne({
      competition: self.competition,
      league     : self.league,
      name       : self.name
    }).populate("competition.name league.name").exec(function (err, dbMap) {
      if (err) {
        return next(err)
      } else if (dbMap) {
        err = new Error('Map "' +
                        dbMap.name +
                        '" already exists in league "' +
                        dbMap.league.name +
                        '" in competition "' +
                        dbMap.competition.name + '"!')
        return next(err)
      } else {
        return next()
      }
    })
  }
})

mapSchema.plugin(mongooseInteger)
mapSchema.plugin(idValidator)

const Map = mongoose.model('Map', mapSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.map = Map
