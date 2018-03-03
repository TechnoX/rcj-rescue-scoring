// -*- tab-width: 2 -*-
const ObjectId = require('mongoose').Types.ObjectId
const express = require('express')
const router = express.Router()
const auth = require('../helper/authLevels')
const ACCESSLEVELS = require('../models/user').ACCESSLEVELS


/* GET home page. */
router.get('/', function (req, res) {
  res.render('admin_home', {user: req.user})
})

router.get('/user', function (req, res) {
  if(req.user.superDuperAdmin) res.render('admin_user', {user: req.user})
  else res.render('access_denied', {user: req.user})
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

router.get('/:competitionid/authority', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('admin_competition_authority', {competition_id: id, user: req.user})
  else res.render('access_denied', {user: req.user})
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

router.get('/:competitionid/maze/editor', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.ADMIN)) res.render('maze_editor', {compid: id, user: req.user})
  else res.render('access_denied', {user: req.user})
})

router.get('/:competitionid/maze/editor/:mapid', function (req, res, next) {
    const id = req.params.mapid
    const cid = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    if(auth.authCompetition(req.user,cid,ACCESSLEVELS.ADMIN)) res.render('maze_editor', {compid: cid, mapid: id, user: req.user})
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

module.exports = router
