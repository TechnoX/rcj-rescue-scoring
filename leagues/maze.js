"use strict"

const logger = require('../config/logger').mainLogger

const maze = require('../models/mazeRun')

const scoreCalculator = require('../helper/scoreCalculator')

module.exports = {
  name  : maze.NAME,
  create: function (run) {
    return new maze.mazeRun({
      competition: run.competition,
      round      : run.round,
      team       : run.team,
      field      : run.field,
      startTime  : run.startTime,
      map        : run.map
    })
  },
  model : maze.model,
  scoreCalculator : scoreCalculator.calculateMazeScore
}