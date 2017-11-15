"use strict"

const logger = require('../config/logger').mainLogger

const line = require('./line')
const maze = require('./maze/index')

module.exports.LINE = line
module.exports.MAZE = maze

var leagues = {}
leagues[line.NAME] = line
leagues[maze.NAME] = maze

module.exports.leagues = leagues

module.exports.names = Object.keys(leagues)

module.exports.isLeague = function (leagueName) {
  return leagues.hasOwnProperty(leagueName)
}