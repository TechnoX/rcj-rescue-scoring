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

roundSchema.pre('save', function (next) {
  var self = this
  if (self.isNew) {
    Round.findOne({
      competition: self._id,
      name       : self.name
    }, function (err, dbRound) {
      if (err) {
        next(err)
      } else if (dbRound) {
        err = new Error('Round with name "' + self.name + '" already exists!')
        next(err)
      } else {
        next()
      }
    })
  } else {
    next()
  }
})

var teamSchema = new Schema({
  name       : {type: String, required: true},
  league     : {type: String, enum: ["primary", "secondary"], required: true},
  competition: {type: ObjectId, ref: 'Competition', required: true}
})

teamSchema.pre('save', function (next) {
  var self = this
  if (self.isNew) {
    Team.findOne({
      competition: self._id,
      name       : self.name
    }, function (err, dbTeam) {
      if (err) {
        next(err)
      } else if (dbTeam) {
        err = new Error('Team with name "' + self.name + '" already exists!')
        next(err)
      } else {
        next()
      }
    })
  } else {
    next()
  }
})

var fieldSchema = new Schema({
  name       : {type: String, required: true},
  competition: {type: ObjectId, ref: 'Competition', required: true}
})

fieldSchema.pre('save', function (next) {
  var self = this
  if (self.isNew) {
    Field.findOne({
      competition: self._id,
      name       : self.name
    }, function (err, dbField) {
      if (err) {
        next(err)
      } else if (dbField) {
        err = new Error('Field with name "' + self.name + '" already exists!')
        next(err)
      } else {
        next()
      }
    })
  } else {
    next()
  }
})

var runSchema = new Schema({
  round      : {type: ObjectId, ref: 'Round', required: true},
  team       : {type: ObjectId, ref: 'Team', required: true},
  field      : {type: ObjectId, ref: 'Field', required: true},
  competition: {type: ObjectId, ref: 'Competition', required: true},
  map        : {type: ObjectId, ref: 'Map', required: true},

  scoring          : [{
    index      : {type: Number, min: 0},
    dropTile   : {type: Boolean},
    scoredItems: {
      obstacle    : {type: Boolean},
      speedbump   : {type: Boolean},
      intersection: {type: Boolean},
      gap         : {type: Boolean},
      dropTile    : {type: Boolean}
    }
  }],
  LoPs             : {type: [Number], min: 0},
  numberOfDropTiles: {type: Number, required: true, min: 0},
  rescuedVictims   : {type: Number, min: 0},
  score            : {type: Number, min: 0},
  showedUp         : {type: Boolean},
  time             : {
    minutes: {type: Number, min: 0, max: 8},
    seconds: {type: Number, min: 0, max: 59}
  }
})

runSchema.pre('save', function (next) {
  var self = this
  if (self.isNew) {
    Run.findOne({
      round: self.round,
      team : self.team
    }).populate("round team").exec(function (err, dbRun) {
      if (err) {
        next(err)
      } else if (dbRun) {
        err = new Error('Team "' + dbRun.team.name +
                        '" already has a run in round "' + dbRun.round.name +
                        '"!')
        next(err)
      } else {
        next()
      }
    })
  } else {
    next()
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
