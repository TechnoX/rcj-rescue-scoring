"use strict"
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
  map        : {type: ObjectId, ref: 'MazeMap', required: true},
  
  tiles             : [{
    isDropTile : {type: Boolean, default: false},
    scoredItems: {
      obstacles   : {type: Boolean, default: false},
      speedbumps  : {type: Boolean, default: false},
      intersection: {type: Boolean, default: false},
      gaps        : {type: Boolean, default: false},
      dropTile    : {type: Boolean, default: false}
    }
  }],
  LoPs              : {type: [Number], min: 0},
  evacuationLevel   : {
    type: Number, default: 1, validate: function (l) {
      return l == 1 || l == 2
    }
  },
  exitBonus         : {type: Boolean, default: false},
  rescuedLiveVictims: {type: Number, min: 0, default: 0},
  rescuedDeadVictims: {type: Number, min: 0, default: 0},
  score             : {type: Number, min: 0, default: 0},
  showedUp          : {type: Boolean, default: false},
  time              : {
    minutes: {type: Number, min: 0, max: 8, default: 0},
    seconds: {type: Number, min: 0, max: 59, default: 0}
  },
  started           : {type: Boolean, default: false}
})

lineRunSchema.pre('save', function (next) {
  const self = this

  self.populate('map', ['name', 'finished'], function (err, populatedRun) {
    if (err) {
      return next(err)
    } else if (!populatedRun.map.finished) {
      err = new Error('Map "' + populatedRun.map.name + '" is not finished!')
      return next(err)
    } else {

      if (self.isNew) {
        LineRun.findOne({
          round: self.round,
          team : self.team
        }).populate("round team").exec(function (err, dbRun) {
          if (err) {
            return next(err)
          } else if (dbRun) {
            err = new Error('Team "' + dbRun.team.name +
                            '" already has a run in round "' +
                            dbRun.round.name +
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
                      return callback(new Error("No competition with that id!"))
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
                      return callback(new Error("No round with that id!"))
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
                      return callback(new Error("No team with that id!"))
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
                      return callback(new Error("No field with that id!"))
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
                      return callback(new Error("No map with that id!"))
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
                  const competitionId = results.competition.id

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
                  self.tiles = new Array(results.map.indexCount).fill({})
                  return next()
                }
              })
          }
        })
      } else {
        return next()
      }
    }
  })
})

const LineRun = mongoose.model('LineRun', lineRunSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.lineRun = LineRun