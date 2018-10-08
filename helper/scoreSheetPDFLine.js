"use strict"
const logger = require('../config/logger').mainLogger
const rule2018 = require('./scoreSheetPDFLine-2018')
const rule2019Draft = require('./scoreSheetPDFLine-2019(Draft)')

module.exports.generateScoreSheet = function(res,runs){
  let rule = runs[0].competition.rule;
  switch(rule){
    case '2019(Draft)':
      return rule2019Draft.generateScoreSheet(res,runs);
    case '2018':
    default:
      return rule2018.generateScoreSheet(res,runs);
  }
}
