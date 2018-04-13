"use strict"
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const logger = require('../config/logger').mainLogger

const pathFinder = require('../leagues/line/pathFinder')

const Map = require('./map.model')
//const LineRun = require('./lineRun').lineRun

const TileType = require('./tileType.model') // XXX: Temporary

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

  if (self.finished) {
    if (!self.isInit("tiles")) {
      // TODO: Fix getting document from db before running pathFinder
    }

    self.populate('tiles.tileType', function (err, populatedMap) {
      if (err) {
        return next(err)
      } else {
        self = populatedMap
        //logger.debug(self)
        try {
          pathFinder(self)
        } catch (err) {
          logger.error(err)
          self.finished = false
        }
        return next()
      }
    })
  } else {
    return next()
  }
})

/*
 Workaround for calling overridden methods in base model
 To call for example method foo(arg1, arg2) do
 base.foo.call(this, arg1, arg2)
 To bind "this" to the current document
 */
const base = Map.schema.methods
lineMapSchema.methods = {
  updateFilter(data) {
    let filteredData = base.updateFilter.call(this, data)

    Object.assign(filteredData, {
      height           : data.height,
      width            : data.width,
      length           : data.length,
      tiles            : data.tiles, // TODO: Refine this
      startTile        : data.startTile ? {
        x: data.startTile.x,
        y: data.startTile.y,
        z: data.startTile.z
      } : undefined,
      numberOfDropTiles: data.numberOfDropTiles
    })

    // Stringify and parse to remove undefined properties
    return JSON.parse(JSON.stringify(filteredData))
  }
}

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const LineMap = module.exports = Map.discriminator("LineMap", lineMapSchema)