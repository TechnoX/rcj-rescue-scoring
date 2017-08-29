"use strict"

const logger = require('../config/logger').mainLogger

const line = require('../models/lineRun')

const scoreCalculator = require('../helper/scoreCalculator')

module.exports = {
  name  : line.NAME,
  create: function (run) {
    return new line.lineRun({
      competition: run.competition,
      round      : run.round,
      team       : run.team,
      field      : run.field,
      startTime  : run.startTime,
      map        : run.map
    })
  },
  model : line.model,
  scoreCalculator : scoreCalculator.calculateLineScore
}
