"use strict"
const NAME = "Maze"
module.exports.NAME = NAME

const mongoose = require('mongoose')
const timestamps = require('mongoose-timestamp')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const competitiondb = require('./competition')
const rundb = require('./run')
const mazeMapdb = require('./mazeMap')

const logger = require('../config/logger').mainLogger

function isOdd(n) {
  return n & 1 // Bitcheck LSB
}
function isEven(n) {
  return !isOdd(n)
}

const mazeRunSchema = new Schema({
  map        : {type: ObjectId, ref: 'MazeMap', required: true, index: true},
  
  tiles    : [{
    x          : {type: Number, integer: true, required: true},
    y          : {type: Number, integer: true, required: true},
    z          : {type: Number, integer: true, required: true},
    scoredItems: {
      speedbump : {type: Boolean, default: false},
      checkpoint: {type: Boolean, default: false},
      rampBottom: {type: Boolean, default: false},
      rampTop   : {type: Boolean, default: false},
      victims   : {
        top   : {type: Boolean, default: false},
        right : {type: Boolean, default: false},
        bottom: {type: Boolean, default: false},
        left  : {type: Boolean, default: false}
      },
      rescueKits: {
        top   : {type: Number, integer: true, min: 0, default: 0},
        right : {type: Number, integer: true, min: 0, default: 0},
        bottom: {type: Number, integer: true, min: 0, default: 0},
        left  : {type: Number, integer: true, min: 0, default: 0}
      }
    }
  }],
  exitBonus: {type: Boolean, default: false},
})

mazeRunSchema.pre('save', function (next) {
  const self = this
  
  self.populate('map', "name finished", function (err, populatedRun) {
    if (err) {
      return next(err)
    } else if (!populatedRun.map.finished) {
      err = new Error('Map "' + populatedRun.map.name + '" is not finished!')
      return next(err)
    } else {
      
      if (self.isNew) {
        // Check that all references matches
        mazeMapdb.mazeMap.findById(self.map, function (err, dbMap) {
          if (err) {
            return next(err)
          } else if (!dbMap) {
            return next(new Error("No map with that id!"))
          } else {
            if (dbMap.competition.toString() != self.competition) {
              return next(new Error("Map does not match competition!"))
            } else {
              self.LoPs = [0]
              return next()
            }
          }
        })
      } else {
        return next()
      }
    }
  })
})

const MazeRun = rundb.run.discriminator(NAME, mazeRunSchema, rundb.options)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.mazeRun = MazeRun
