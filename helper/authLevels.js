"use strict"
const logger = require('../config/logger').mainLogger

const ACCESSLEVELS = require('../models/user').ACCESSLEVELS

/**
 * View only started runs to public
 * @param user
 * @param run
 */
function authViewRun(user, run) {
  if (user == null) {
    return run.started !== undefined && run.started
  } else if (user.superDuperAdmin) {
    return true
  } else if (authCompetition(user, run.competition, ACCESSLEVELS.NONE + 1)) {
    return true
  }
  return false
}
module.exports.authViewRun = authViewRun

function authRun(user, run, level) {
  if (user == null) {
    return false
  }

  if (user.superDuperAdmin) {
    return true
  }

  if (authCompetition(user, run.competition, level)) {
    for (let i = 0; i < run.judges.length; i++) {
      const comp = user.competitions[i]
      if (comp[i].id == competitionId && comp[i].accessLevel >= authLevels) {
        return true
      }
    }
  }
  return false
}
module.exports.authRun = authRun

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
      if (comp.id == competitionId && comp.accessLevel >= level) {
        return true
      }
    }
  }
  return false
}
module.exports.authCompetition = authCompetition