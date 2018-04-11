"use strict"
const mongoose = require('mongoose')
const mongooseInteger = require('mongoose-integer')
const idValidator = require('mongoose-id-validator')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const logger = require('../../config/logger').mainLogger

const pathFinder = require('./pathFinder')

const Map = require('./map.model')
const LineRun = require('./lineRun').lineRun

/**
 *
 *@constructor
 *
 * @param {String} username - The username
 * @param {String} password - The password
 * @param {String} salt - The salt used, unique for every user
 * @param {Boolean} admin - If the user is admin or not
 */
const lineMapSchema = new Schema({
  height           : {type: Number, integer: true, required: true, min: 1},
  width            : {type: Number, integer: true, required: true, min: 1},
  length           : {type: Number, integer: true, required: true, min: 1},
  indexCount       : {type: Number, integer: true, min: 1},
  tiles            : [{
    x        : {type: Number, integer: true, required: true},
    y        : {type: Number, integer: true, required: true},
    z        : {type: Number, integer: true, required: true},
    tileType : {type: ObjectId, ref: 'TileType', required: true},
    rot      : {
      type: Number, default: 0, validate: function (a) {
        return a == 0 || a == 90 || a == 180 || a == 270
      }
    },
    items    : {
      obstacles : {
        type   : Number,
        integer: true,
        default: 0,
        min    : 0
      },
      speedbumps: {
        type   : Number,
        integer: true,
        default: 0,
        min    : 0
      }
    },
    index    : {type: [Number], min: 0},
    levelUp  : {type: String, enum: ["top", "right", "bottom", "left"]},
    levelDown: {type: String, enum: ["top", "right", "bottom", "left"]}
  }],
  startTile        : {
    x: {type: Number, integer: true, required: true, min: 0},
    y: {type: Number, integer: true, required: true, min: 0},
    z: {type: Number, integer: true, required: true, min: 0}
  },
  numberOfDropTiles: {type: Number, required: true, min: 0}
})

lineMapSchema.pre('save', function (next) {
  var self = this
  
  self.populate('tiles.tileType', function (err, populatedMap) {
    if (err) {
      return next(err)
    } else {
      self = populatedMap
      //logger.debug(self)
      
      if (self.finished) {
        try {
          pathFinder(self)
        } catch (err) {
          logger.error(err)
          self.finished = false
        }
      }
      
      if (self.isNew || self.isModified("name")) {
        LineMap.findOne({
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
      } else {
        LineRun.findOne({
          map    : self._id,
          started: true
        }).lean().exec(function (err, dbRun) {
          if (err) {
            return next(err)
          } else if (dbRun) {
            err = new Error('Map "' + self.name +
                            '" used in started runs, cannot modify!')
            return next(err)
          } else {
            return next()
          }
        })
      }
    }
  })
})

lineMapSchema.plugin(mongooseInteger)
lineMapSchema.plugin(idValidator)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const LineMap = module.exports = Map.discriminator("LineMap", lineMapSchema)