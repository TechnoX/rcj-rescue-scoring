"use strict"
const mongoose = require('mongoose')
const timestamps = require('mongoose-timestamp')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const competitiondb = require('./competition')

const logger = require('../config/logger').mainLogger

const options = {discriminatorKey: 'league'}
module.exports.options = options

const runSchema = new Schema({
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  round      : {type: ObjectId, ref: 'Round', required: true, index: true},
  team       : {type: ObjectId, ref: 'Team', required: true, index: true},
  field      : {type: ObjectId, ref: 'Field', required: true, index: true},

  judges: [{type: ObjectId, ref: 'User'}],

  LoPs: {type: [Number], min: 0},

  score    : {type: Number, min: 0, default: 0},
  showedUp : {type: Boolean, default: false},
  time     : {
    minutes: {type: Number, min: 0, max: 8, default: 0},
    seconds: {type: Number, min: 0, max: 59, default: 0}
  },
  status   : {type: Number, min: 0, default: 0},
  sign     : {
    captain   : {type: String, default: ""},
    referee   : {type: String, default: ""},
    referee_as: {type: String, default: ""}
  },
  started  : {type: Boolean, default: false, index: true},
  comment  : {type: String, default: ""},
  startTime: {type: Number, default: 0}
}, options)

runSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Run.findOne({
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

              if (results.team.competition != competitionId) {
                return next(new Error("Team does not match competition!"))
              }

              if (results.field.competition != competitionId) {
                return next(new Error("Field does not match competition!"))
              }

              if (self.league != null) {
                if (results.round.league != self.league) {
                  return next(new Error("Round does not match league!"))
                }

                if (results.team.league != self.league) {
                  return next(new Error("Team does not match league!"))
                }

                if (results.field.league != self.league) {
                  return next(new Error("Field does not match league!"))
                }
              }

              return next()
            }
          })
      }
    })
  } else {
    return next()
  }
})

runSchema.plugin(timestamps)

const Run = mongoose.model('Run', runSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.run = Run

// What is allowed to be changed
module.exports.model = {
  judges: {type: Array, child: {type: String}, extendable: true},

  LoPs: {type: Array, child: {type: Number}, extendable: true},

  showedUp : {type: Boolean},
  time     : {
    type : Object,
    child: {
      minutes: {type: Number},
      seconds: {type: Number}
    }
  },
  status   : {type: Number},
  sign     : {
    type : Object,
    child: {
      captain   : {type: String},
      referee   : {type: String},
      referee_as: {type: String}
    }
  },
  started  : {type: Boolean},
  comment  : {type: String},
  startTime: {type: Number},

  score: {type: Number} // Delete this in submodels to calculate score on backend
}

