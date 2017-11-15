"use strict"
const mongoose = require('mongoose')
const timestamps = require('mongoose-timestamp')
const idValidator = require('mongoose-id-validator')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const logger = require('../config/logger').mainLogger

const runSchema = new Schema({
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  league     : {type: ObjectId, ref: 'League', required: true, index: true},
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
})
runSchema.index({competition: 1, league: 1})

runSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    Run.findOne({
      round: self.round,
      team : self.team
    }).populate("round.name team.name").exec(function (err, dbRun) {
      if (err) {
        return next(err)
      } else if (dbRun) {
        err = new Error('Team "' + dbRun.team.name +
                        '" already has a run in round "' +
                        dbRun.round.name +
                        '"!')
        return next(err)
      } else {
        self.populate("league round.competition round.league team.competition team.league field.competition field.league", function (err, popRun) {
          if (err) {
            return next(err)
          } else {
            const competitionId = results.competition.id

            if (popRun.round.competition != competitionId) {
              return next(new Error("Round does not match competition!"))
            }

            if (popRun.team.competition != competitionId) {
              return next(new Error("Team does not match competition!"))
            }

            if (popRun.field.competition != competitionId) {
              return next(new Error("Field does not match competition!"))
            }

            if (popRun.round.league != self.league) {
              return next(new Error("Round does not match league!"))
            }

            if (popRun.team.league != self.league) {
              return next(new Error("Team does not match league!"))
            }

            if (popRun.field.league != self.league) {
              return next(new Error("Field does not match league!"))
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
runSchema.plugin(idValidator)

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

