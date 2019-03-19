// -*- tab-width: 2 -*-
const ObjectId = require('mongoose').Types.ObjectId
const express = require('express')
const router = express.Router()
const auth = require('../helper/authLevels')
const ACCESSLEVELS = require('../models/user').ACCESSLEVELS
const ruleDetector = require('../helper/ruleDetector')


/* GET home page. */
router.get('/', function (req, res) {
  res.render('admin_home', {user: req.user})
})

router.get('/user', function (req, res) {
  if(req.user.superDuperAdmin) res.render('admin_user', {user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/short', function (req, res) {
  if(req.user.superDuperAdmin) res.render('admin_short', {user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/restore', function (req, res) {
  res.render('admin_restore', {user: req.user})
})

router.get('/:competitionid', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('competition_admin', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/teams', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('team_admin', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/teams/bulk', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('team_bulk', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/settings', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('admin_competition_settings', {competition_id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/backup', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('admin_competition_backup', {competition_id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/handover', function (req, res, next) {  
  
  res.render('runs_handover', {user: req.user})
})

router.get('/:competitionid/line/runs', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('line_run_admin', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})



router.get('/:competitionid/line/runs/bulk', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('line_run_bulk', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/maze/runs/bulk', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('maze_run_bulk', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/line/maps', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('line_map_admin', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/maze/runs', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('maze_run_admin', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/maze/maps', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('maze_map_admin', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/maze/editor', async function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
    
  let rule = await ruleDetector.getRuleFromCompetitionId(id);
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('maze_editor', {compid: id, user: req.user, rule: rule})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/maze/editor/:mapid', async function (req, res, next) {
    const id = req.params.mapid
    const cid = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    
    let rule = await ruleDetector.getRuleFromCompetitionId(cid);
    
    if(auth.authCompetition(req.user,cid,ACCESSLEVELS.ADMIN)) res.render('maze_editor', {compid: cid, mapid: id, user: req.user, rule: rule})
    else res.render('access_denied', {user: req.user})

})

router.get('/:competitionid/rounds', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('round_admin', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/line/editor', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('line_editor', {compid: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/line/editor/:mapid', function (req, res, next) {
    const id = req.params.mapid
    const cid = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    if(auth.authCompetition(req.user,cid,ACCESSLEVELS.ADMIN)) res.render('line_editor', {compid: cid, mapid: id, user: req.user})
    else res.render('access_denied', {user: req.user})

})

router.get('/:competitionid/fields', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('field_admin', {id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/line/tilesets', function (req, res, next) {
  res.render('tileset_admin',{user: req.user})
})

router.get('/:competitionid/line/apteam/:team', function (req, res, next) {
    const id = req.params.competitionid
    const tid = req.params.team
    res.render('line_apTeam',{id: id, user: req.user, tid: tid})
})

router.get('/:competitionid/maze/apteam/:team', function (req, res, next) {
    const id = req.params.competitionid
    const tid = req.params.team
    res.render('maze_apTeam',{id: id, user: req.user, tid: tid})
})

router.get('/kiosk/:kioskNum', function (req, res, next) {
  const num = req.params.kioskNum
  
  res.render('kiosk', {num: num, user: req.user})
})



module.exports = router
