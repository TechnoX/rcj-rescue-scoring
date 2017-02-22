"use strict"
const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

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
const mazeMapSchema = new Schema({
  competition      : {type: ObjectId, ref: 'Competition', required: true},
  name             : {type: String, required: true},
  height           : {type: Number, required: true, min: 1},
  width            : {type: Number, required: true, min: 1},
  length           : {type: Number, required: true, min: 1},
  tiles            : [{
    x        : {type: Number, required: true},
    y        : {type: Number, required: true},
    z        : {type: Number, required: true},

    levelUp  : {type: String, enum: ["top", "right", "bottom", "left"]},
    levelDown: {type: String, enum: ["top", "right", "bottom", "left"]}
  }],
  startTile        : {
    x: {type: Number, required: true, min: 0},
    y: {type: Number, required: true, min: 0},
    z: {type: Number, required: true, min: 0}
  }
})

mazeMapSchema.pre('save', function (next) {
  var self = this

  if (self.isNew) {
    MazeMap.findOne({
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
    return next()
  }
})

const MazeMap = mongoose.model('MazeMap', mazeMapSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.mazeMap = MazeMap
