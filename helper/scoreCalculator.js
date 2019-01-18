"use strict"
const logger = require('../config/logger').mainLogger
const rule2018 = require('./scoreCalculator-2018')
const rule2019 = require('./scoreCalculator-2019')

module.exports.calculateLineScore = function (run) {
  let rule = run.competition.rule;
  switch(rule){
    case '2019':
      return rule2019.calculateLineScore(run);
    case '2018':
    default:
      return rule2018.calculateLineScore(run);
  }
}

module.exports.calculateMazeScore = function (run) {
  let rule = run.competition.rule;
  switch(rule){
    case '2019':
      return rule2019.calculateMazeScore(run);
    case '2018':
    default:
      return rule2018.calculateMazeScore(run);
  }
}
