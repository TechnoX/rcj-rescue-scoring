"use strict"
const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const Run = require('./run.model')

const logger = require('../../config/logger').mainLogger


const lineRunSchema = new Schema({
  map: {type: ObjectId, ref: 'LineMap', required: true, index: true},
  
  tiles             : [{
    isDropTile: {type: Boolean, default: false},
    scored    : {type: Boolean, default: false}
  }],
  evacuationLevel   : {
    type: Number, default: 1, validate: function (l) {
      return l == 1 || l == 2
    }
  },
  exitBonus         : {type: Boolean, default: false},
  rescuedLiveVictims: {type: Number, min: 0, default: 0},
  rescuedDeadVictims: {type: Number, min: 0, default: 0}
})

lineRunSchema.pre('save', function (next) {
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
        lineMapdb.lineMap.findById(self.map, function (err, dbMap) {
          if (err) {
            return next(err)
          } else if (!dbMap) {
            return next(new Error("No map with that id!"))
          } else {
            if (dbMap.competition.toString() != self.competition) {
              return next(new Error("Map does not match competition!"))
            } else {
              self.LoPs = new Array(dbMap.numberOfDropTiles).fill(0)
              self.tiles = new Array(dbMap.indexCount).fill({})
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


/*
 Workaround for calling overridden methods in base model
 To call for example method foo(arg1, arg2) do
 base.foo.call(this, arg1, arg2)
 To bind "this" to the current document
 */
const base = Run.schema.methods
lineRunSchema.methods = {
  // TODO: Update filter
  updateFilter(data) {
    let filteredData = base.updateFilter.call(this, data)

    Object.assign(filteredData, {
      height           : data.height,
      width            : data.width,
      length           : data.length,
      tiles            : data.tiles,
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

lineRunSchema.plugin(mongooseInteger)
lineRunSchema.plugin(idValidator)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const LineRun = module.exports = Run.discriminator("LineRun", lineRunSchema)