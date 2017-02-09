const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const competitiondb = require('./competition')
const lineMapdb = require('./lineMap')

const logger = require('../config/logger').mainLogger

const LINE_LEAGUES = require("./competition").LINE_LEAGUES

const lineRunSchema = new Schema({
  competition: {type: ObjectId, ref: 'Competition', required: true},
  round      : {type: ObjectId, ref: 'Round', required: true},
  team       : {type: ObjectId, ref: 'Team', required: true},
  field      : {type: ObjectId, ref: 'Field', required: true},
  map        : {type: ObjectId, ref: 'LineMap', required: true},

  tiles         : [{
    dropTile   : {type: Boolean, default: false},
    scoredItems: {
      obstacle    : {type: Boolean, default: false},
      speedbump   : {type: Boolean, default: false},
      intersection: {type: Boolean, default: false},
      gap         : {type: Boolean, default: false},
      dropTile    : {type: Boolean, default: false}
    }
  }],
  LoPs          : {type: [Number], min: 0},
  rescuedVictims: {type: Number, min: 0, default: 0},
  score         : {type: Number, min: 0, default: 0},
  showedUp      : {type: Boolean, default: false},
  time          : {
    minutes: {type: Number, min: 0, max: 8, default: 0},
    seconds: {type: Number, min: 0, max: 59, default: 0}
  }
})

lineRunSchema.pre('save', function (next) {
  var self = this
  if (self.isNew) {
    LineRun.findOne({
      round: self.round,
      team : self.team
    }).populate("round team").exec(function (err, dbRun) {
      if (err) {
        return next(err)
      } else if (dbRun) {
        err = new Error('Team "' + dbRun.team.name +
                        '" already has a run in round "' + dbRun.round.name +
                        '"!')
        return next(err)
      } else {
        // Check that all references matches
        async.parallel({
            competition: function (callback) {
              competitiondb.competition.findById(self.competition, function (err, dbCompetition) {
                if (err) {
                  return callback(err)
                } else if (!dbCompetition) {
                  return callback("No competition with that id!")
                } else {
                  return callback(null, dbCompetition)
                }
              })
            },
            round      : function (callback) {
              competitiondb.round.findById(self.round, function (err, dbRound) {
                if (err) {
                  return callback(err)
                } else if (!dbRound) {
                  return callback("No round with that id!")
                } else {
                  return callback(null, dbRound)
                }
              })
            },
            team       : function (callback) {
              competitiondb.team.findById(self.team, function (err, dbTeam) {
                if (err) {
                  return callback(err)
                } else if (!dbTeam) {
                  return callback("No team with that id!")
                } else {
                  return callback(null, dbTeam)
                }
              })
            },
            field      : function (callback) {
              competitiondb.field.findById(self.field, function (err, dbField) {
                if (err) {
                  return callback(err)
                } else if (!dbField) {
                  return callback("No field with that id!")
                } else {
                  return callback(null, dbField)
                }
              })
            },
            map        : function (callback) {
              lineMapdb.lineMap.findById(self.map, function (err, dbMap) {
                if (err) {
                  return callback(err)
                } else if (!dbMap) {
                  return callback("No map with that id!")
                } else {
                  return callback(null, dbMap)
                }
              })
            }
          },
          function (err, results) {
            if (err) {
              return next(err)
            } else {
              const competitionId = results.competition._id

              if (results.round.competition != competitionId) {
                return next(new Error("Round does not match competition!"))
              }
              if (LINE_LEAGUES.indexOf(results.round.league) == -1) {
                return next(new Error("Round does not match league!"))
              }

              if (results.team.competition != competitionId) {
                return next(new Error("Team does not match competition!"))
              }
              if (LINE_LEAGUES.indexOf(results.team.league) == -1) {
                return next(new Error("Team does not match league!"))
              }

              if (results.field.competition != competitionId) {
                return next(new Error("Field does not match competition!"))
              }
              if (LINE_LEAGUES.indexOf(results.field.league) == -1) {
                return next(new Error("Field does not match league!"))
              }

              if (results.map.competition != competitionId) {
                return next(new Error("Map does not match competition!"))
              }

              self.LoPs = new Array(results.map.numberOfDropTiles).fill(0)

              return next()
            }
          })
      }
    })
  } else {
    return next()
  }
})

const LineRun = mongoose.model('LineRun', lineRunSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.lineRun = LineRun