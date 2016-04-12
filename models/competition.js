var mongoose = require('mongoose')
var validator = require('validator')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

var logger = require('../config/logger').mainLogger

/**
 *
 *@constructor
 *
 * @param {String} username - The username
 * @param {String} password - The password
 * @param {String} salt - The salt used, unique for every user
 * @param {Boolean} admin - If the user is admin or not
 */


var competitionSchema = new Schema({
  name: {type: String, required: true, unique: true}
})

var roundSchema = new Schema({
  name       : {type: String, required: true},
  competition: {type: ObjectId, ref: 'Competition', required: true}
})

var teamSchema = new Schema({
  name       : {type: String, required: true},
  league     : {type: String, enum: ["primary", "secondary"], required: true},
  competition: {type: ObjectId, ref: 'Competition', required: true}
})

var fieldSchema = new Schema({
  name : {type: String, required: true},
  competition: {type: ObjectId, ref: 'Competition', required: true}
})

var runSchema = new Schema({
  round: {type: ObjectId, ref: 'Round', required: true},
  team : {type: ObjectId, ref: 'Team', required: true},
  field : {type: ObjectId, ref: 'Field', required: true},
  competition: {type: ObjectId, ref: 'Competition', required: true},

  height           : {type: Number, required: true, min: 1},
  width            : {type: Number, required: true, min: 1},
  length           : {type: Number, required: true, min: 1},
  tiles            : [{
    x          : {type: Number, required: true},
    y          : {type: Number, required: true},
    z          : {type: Number, required: true},
    tileType   : {type: ObjectId, ref: 'TileType', required: true},
    rot        : {type: Number, min: 0, max: 270, required: true},
    items      : {
      obstacles    : {type: Number, min: 0},
      speedbumps   : {type: Number, min: 0},
      intersections: {type: Number, min: 0},
      gaps         : {type: Number, min: 0},
      dropTiles    : {type: Number, min: 0}
    },
    scoredItems: {
      obstacles    : {type: [Boolean]},
      speedbumps   : {type: [Boolean]},
      intersections: {type: [Boolean]},
      gaps         : {type: [Boolean]},
      dropTiles    : {type: [Boolean]}
    },
    index      : {type: [Number], min: 0},
    levelUp    : {type: String, enum: ["top", "right", "bottom", "left"]},
    levelDown  : {type: String, enum: ["top", "right", "bottom", "left"]}
  }],
  startTile        : {
    x: {type: Number, required: true, min: 0},
    y: {type: Number, required: true, min: 0},
    z: {type: Number, required: true, min: 0}
  },
  LoPs             : {type: [Number], min: 0},
  numberOfDropTiles: {type: Number, required: true, min: 0},
  rescuedVictims   : {type: Number, min: 0},
  score            : {type: Number, min: 0},
  time             : {
    minutes: {type: Number, min: 0},
    seconds: {type: Number, min: 0, max: 59}
  }
})


var Competition = mongoose.model('Competition', competitionSchema)
var Round = mongoose.model('Round', roundSchema)
var Team = mongoose.model('Team', teamSchema)
var Field = mongoose.model('Field', fieldSchema)
var Run = mongoose.model('Run', runSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.competition = Competition
module.exports.round = Round
module.exports.team = Team
module.exports.field = Field
module.exports.run = Run
