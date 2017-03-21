const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

const LINE_LEAGUES = ["Primary", "Secondary"]
const MAZE_LEAGUES = ["Maze"]

const LEAGUES = [].concat(LINE_LEAGUES, MAZE_LEAGUES)

module.exports.LINE_LEAGUES = LINE_LEAGUES
module.exports.MAZE_LEAGUES = MAZE_LEAGUES
module.exports.LEAGUES = LEAGUES


/**
 *
 *@constructor
 *
 * @param {String} username - The username
 * @param {String} password - The password
 * @param {String} salt - The salt used, unique for every user
 * @param {Boolean} admin - If the user is admin or not
 */


const competitionSchema = new Schema({
  name: {type: String, required: true, unique: true}
})

const roundSchema = new Schema({
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  name       : {type: String, required: true},
  league     : {type: String, enum: LEAGUES, required: true, index: true}
})

roundSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Round.findOne({
      competition: self._id,
      name       : self.name,
      league     : self.league
    }, function (err, dbRound) {
      if (err) {
        return next(err)
      } else if (dbRound) {
        err = new Error('Round with name "' + self.name + '" already exists!')
        return next(err)
      } else {
        return next()
      }
    })
  } else {
    return next()
  }
})

const teamSchema = new Schema({
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  name       : {type: String, required: true},
  league     : {type: String, enum: LEAGUES, required: true, index: true}
})

teamSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Team.findOne({
      competition: self._id,
      name       : self.name,
      league     : self.league
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

const fieldSchema = new Schema({
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  name       : {type: String, required: true},
  league     : {type: String, enum: LEAGUES, required: true, index: true}
})

fieldSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Field.findOne({
      competition: self._id,
      name       : self.name,
      league     : self.league
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


const Competition = mongoose.model('Competition', competitionSchema)
const Round = mongoose.model('Round', roundSchema)
const Team = mongoose.model('Team', teamSchema)
const Field = mongoose.model('Field', fieldSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.competition = Competition
module.exports.round = Round
module.exports.team = Team
module.exports.field = Field
