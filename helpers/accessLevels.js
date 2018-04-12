"use strict"

const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN     : "admin",
  MAINJUDGE : "mainjudge",
  JUDGE     : "judge",
  NONE      : "none"
}
module.exports.ROLES = ROLES

const ACCESSLEVELS = {}
ACCESSLEVELS[ROLES.SUPERADMIN] = 4
ACCESSLEVELS[ROLES.ADMIN] = 3
ACCESSLEVELS[ROLES.MAINJUDGE] = 2
ACCESSLEVELS[ROLES.JUDGE] = 1
ACCESSLEVELS[ROLES.NONE] = 0

module.exports.compare = (a, b) => {
  return ACCESSLEVELS[a] - ACCESSLEVELS[b]
}

module.exports.isGt = (a, b) => {
  return this.compare(a, b) > 0
}

module.exports.isGte = (a, b) => {
  return this.compare(a, b) >= 0
}

module.exports.equals = (a, b) => {
  return this.compare(a, b) == 0
}

module.exports.isLte = (a, b) => {
  return this.compare(a, b) <= 0
}

module.exports.isLt = (a, b) => {
  return this.compare(a, b) < 0
}

module.exports.getUserRole = (user, options) => {
  if (user == null) {
    return ROLES.NONE
  } else {
    if (user.superAdmin) {
      return ROLES.SUPERADMIN
    } else if (options != null) {
      if (options.competition) {
        for (let i = 0; i < user.competitions.length; i++) {
          if (user.competitions[i].id == options.competition) {
            return user.competitions[i].role
          }
        }
      }
      if (options.run) {
        // TODO: Do something else?
      }
    }
  }
}
