"use strict"

const logger = require('../config/logger').mainLogger

const line = require('./lineRun')
const maze = require('./mazeRun')

const scoreCalculator = require('../../helper/scoreCalculator')

const LINE = {
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
module.exports.LINE = LINE

const MAZE = {
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
module.exports.MAZE = MAZE

var leagues = {}
leagues[line.NAME] = LINE
leagues[maze.NAME] = MAZE

module.exports.leagues = leagues

module.exports.names = Object.keys(leagues)

module.exports.isLeague = function (leagueName) {
  return leagues.hasOwnProperty(leagueName)
}