"use strict"
const logger = require('../config/logger').mainLogger
const rule2018 = require('./scoreCalculator-2018')
const rule2019Draft = require('./scoreCalculator-2019(Draft)')

module.exports.calculateLineScore = function (run) {
  let rule = run.competition.rule;
  switch(rule){
    case '2019(Draft)':
      return rule2019Draft.calculateLineScore(run);
    case '2018':
    default:
      return rule2018.calculateLineScore(run);
  }
}

module.exports.calculateMazeScore = function (run) {
  let rule = run.competition.rule;
  switch(rule){
    case '2019(Draft)':
      return rule2019Draft.calculateMazeScore(run);
    case '2018':
    default:
      return rule2018.calculateMazeScore(run);
  }
}
