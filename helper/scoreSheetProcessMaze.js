"use strict"
const logger = require('../config/logger').mainLogger
const rule2018 = require('./scoreSheetProcessMaze-2018')
const rule2019Draft = require('./scoreSheetProcessMaze-2019(Draft)')

module.exports.processScoreSheet = function(rule, posDataRaw, scoreSheetFileName){
  switch(rule){
    case '2019(Draft)':
      return rule2019Draft.processScoreSheet(posDataRaw, scoreSheetFileName);
    case '2018':
    default:
      return rule2018.processScoreSheet(posDataRaw, scoreSheetFileName);
  }
}
