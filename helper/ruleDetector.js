"use strict"
var mongoose = require('mongoose');
const logger = require('../config/logger').mainLogger
const lineRun = require('../models/lineRun').lineRun
const mazeRun = require('../models/mazeRun').mazeRun
const competition = require('../models/competition').competition

const async = require('async')

const ObjectId = require('mongoose').Types.ObjectId

async function _fromRunId(model,id){
  if (!ObjectId.isValid(id)) {
    return -1;
  }
  try {
    const result = await model.findById(id, "-__v").populate(["competition"]).exec();
    return result.competition.rule
  }
  catch(err){
    return "0";
  }
}

module.exports.getRuleFromLineRunId = async function(id){
  let rule = await _fromRunId(lineRun,id);
  if(!rule) rule = 2018;
  return rule;
}

module.exports.getRuleFromMazeRunId = async function(id){
  let rule = await _fromRunId(mazeRun,id);
  if(!rule) rule = 2018;
  return rule;
}

module.exports.getRuleFromCompetitionId = async function(id){
    if (!ObjectId.isValid(id)) {
        return -1;
    }
    try {
        const result = await competition.findById(id, "-__v").exec();
        return result.rule
    }
    catch(err){
      return "0";
    }
}