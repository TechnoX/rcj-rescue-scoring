"use strict"
const logger = require('../config/logger').mainLogger

const ACCESSLEVELS = require('../models/user').ACCESSLEVELS

/**
 * View only started runs to public
 * @param user
 * @param run
 */
function authViewRun(user, run, level) {
  if (run == null) {
    return false
  }
  
  if (user == null) {
    return run.started !== undefined && run.started
  }
  
  if (user.superDuperAdmin) {
    return true
  }
  
  if (run.competition != undefined && run.competition.constructor == String) {
    var competitionId = run.competition
  } else if (run.competition != undefined &&
             run.competition.constructor == Object) {
    var competitionId = run.competition._id
  }
  if (authCompetition(user, competitionId, level)) {
    return true
  }
  return false
}
module.exports.authViewRun = authViewRun

function authJudgeRun(user, run, level) {
  if (user == null) {
    return false
  }
  
  if (user.superDuperAdmin) {
    return true
  }
  
  if (run.competition != undefined && run.competition.constructor == String) {
    var competitionId = run.competition
  } else if (run.competition != undefined &&
             run.competition.constructor == Object) {
    var competitionId = run.competition._id
  }
  if (authCompetition(user, competitionId, level)) {
    for (let i = 0; i < run.judges.length; i++) {
      const comp = user.competitions[i]
      if (comp[i].id == competitionId && comp[i].accessLevel >= authLevels) {
        return true
      }
    }
  }
  return false
}
module.exports.authJudgeRun = authJudgeRun

function authCompetition(user, competitionId, level) {
  if (user == null) {
    return false
  }
  
  if (user.superDuperAdmin) {
    return true
  }
  if (user.competitions != undefined) {
    for (let i = 0; i < user.competitions.length; i++) {
      const comp = user.competitions[i]
      if (comp.id.toString() == competitionId && comp.accessLevel >= level) {
        return true
      }
    }
  }
  return false
}
module.exports.authCompetition = authCompetition