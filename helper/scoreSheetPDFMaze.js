"use strict"
const logger = require('../config/logger').mainLogger
const rule2018 = require('./scoreSheetPDFMaze-2018')
const rule2019 = require('./scoreSheetPDFMaze-2019')

module.exports.generateScoreSheet = function(res,runs){
  let rule = runs[0].competition.rule;
  switch(rule){
    case '2019':
      return rule2019.generateScoreSheet(res,runs);
    case '2018':
    default:
      return rule2018.generateScoreSheet(res,runs);
  }
}
