const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger
const env = require('node-env-file')
env('process.env')

const LEAGUES_JSON = require('../leagues')

var LINE_LEAGUES = [];
var MAZE_LEAGUES = [];
for(let i in LEAGUES_JSON){
  if(LEAGUES_JSON[i].type == "line") LINE_LEAGUES.push(LEAGUES_JSON[i].id);
  if(LEAGUES_JSON[i].type == "maze") MAZE_LEAGUES.push(LEAGUES_JSON[i].id);
}


logger.debug("Available line leagues : " + LINE_LEAGUES);
logger.debug("Available maze leagues : " + MAZE_LEAGUES);

const SUPPORT_RULES = ["2018","2019"];

const LEAGUES = [].concat(LINE_LEAGUES, MAZE_LEAGUES);

module.exports.LINE_LEAGUES = LINE_LEAGUES;
module.exports.MAZE_LEAGUES = MAZE_LEAGUES;
module.exports.LEAGUES = LEAGUES;
module.exports.LEAGUES_JSON = LEAGUES_JSON;


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
  name: {type: String, required: true, unique: true},
  rule: {type: String, enum: SUPPORT_RULES, required: true},
  logo: {type: String, default: ""},
  bkColor: {type: String, default: "#fff"},
  color: {type: String, default: "#000"},
  message: {type: String, default: ""},
  description: {type: String, default: ""},
  ranking: [{
    'league': {type: String, enum: LEAGUES},
    'num': {type: Number, default: 20}
  }]
})

const signageSchema = new Schema({
  name       : {type: String, required: true},
  content :[{
      duration: {type: Number, required: true},
      type: {type: String, required: true},
      url: {type: String, required: true},
      group : {type: String , default: '0'},
      disable: {type: Boolean, default: false}
  }],
  news : {type: [String]}
})

signageSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Signage.findOne({
      name       : self.name
    }, function (err, dbSignage) {
      if (err) {
        return next(err)
      } else if (dbSignage) {
        err = new Error('Signage setting with name "' + self.name + '" already exists!')
        return next(err)
      } else {
        return next()
      }
    })
  } else {
    return next()
  }
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
      competition: self.competition,
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
  league     : {type: String, enum: LEAGUES, required: true, index: true},
  inspected  : {type: Boolean, default: false},
  comment    : {type: String, default: ""},
  interviewer: {type: String, default: ""},
  docPublic  : {type: Boolean, default: false},
  code       : {type: String, default: ""}
})

teamSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Team.findOne({
      competition: self.competition,
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
      competition: self.competition,
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
const Signage = mongoose.model('Signage', signageSchema)
const Round = mongoose.model('Round', roundSchema)
const Team = mongoose.model('Team', teamSchema)
const Field = mongoose.model('Field', fieldSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.competition = Competition
module.exports.signage = Signage
module.exports.round = Round
module.exports.team = Team
module.exports.field = Field
