"use strict"
const mongoose = require('mongoose')
const mongooseInteger = require('mongoose-integer')
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
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  name       : {type: String, required: true},
  height     : {type: Number, integer: true, required: true, min: 1},
  width      : {type: Number, integer: true, required: true, min: 1},
  length     : {type: Number, integer: true, required: true, min: 1},
  cells      : [{
    x         : {type: Number, integer: true, required: true},
    y         : {type: Number, integer: true, required: true},
    z         : {type: Number, integer: true, required: true},
    isTile    : {type: Boolean, default: false},
    isWall    : {type: Boolean, default: false},
    isLinear  : {type: Boolean, default: false},
    checkpoint: {type: Boolean, default: false},
    speedbump : {type: Boolean, default: false},
    black     : {type: Boolean, default: false},
    victims   : {
      top   : {type: Boolean, default: false},
      right : {type: Boolean, default: false},
      bottom: {type: Boolean, default: false},
      left  : {type: Boolean, default: false}
    },

    levelUp  : {type: String, enum: ["top", "right", "bottom", "left"]},
    levelDown: {type: String, enum: ["top", "right", "bottom", "left"]}
  }],
  startTile  : {
    x: {type: Number, integer: true, required: true, min: 0},
    y: {type: Number, integer: true, required: true, min: 0},
    z: {type: Number, integer: true, required: true, min: 0}
  }
})

function isOdd(n) {
  return n & 1 // Bitcheck LSB
}
function isEven(n) {
  return !isOdd(n)
}

mazeMapSchema.pre('save', function (next) {
  var self = this

  for (let i = 0; i < self.cells.length; i++) {
    let cell = self.cells[i]

    if (isEven(cell.x) && isEven(cell.y)) {
      cell.isTile = true
      cell.isWall = false
    } else if (isOdd(cell.x) && isOdd(cell.y)) {
      const err = new Error("Illegal cell placement at x: " + cell.x + ", y: " +
                            cell.y + "!")
      return next(err)
    } else {
      cell.isWall = true
      cell.isTile = false
      cell.checkpoint = false
      cell.speedbump = false
      cell.black = false
      cell.victims = {
        top   : false,
        right : false,
        bottom: false,
        left  : false
      }
    }
  }

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

mazeMapSchema.plugin(mongooseInteger)

const MazeMap = mongoose.model('MazeMap', mazeMapSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.mazeMap = MazeMap
