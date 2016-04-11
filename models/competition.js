var mongoose = require('mongoose')
var validator = require('validator')
var Schema = mongoose.Schema

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
  name  : {type: String, required: true, unique: true}
})

var roundSchema = new Schema({
  name  : {type: String, required: true, unique: true},
  competition : {type: Schema.Types.ObjectId, ref: 'Competition', required: true}
})

var runSchema = new Schema({
  round : {type: Schema.Types.ObjectId, ref: 'Round', required: true},
  team : {type: Schema.Types.ObjectId, ref: 'Team', required: true}
})

var teamSchema = new Schema({
  name  : {type: String, required: true, unique: true},
  league: {type: String, enum: ["primary", "secondary"], required: true},
  competition : {type: Schema.Types.ObjectId, ref: 'Competition', required: true}
})


var Competition = mongoose.model('Competition', competitionSchema)
var Round = mongoose.model('Round', roundSchema)
var Run = mongoose.model('Run', runSchema)
var Team = mongoose.model('Team', teamSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.competition = Competition
module.exports.round = Round
module.exports.run = Run
module.exports.team = Team
