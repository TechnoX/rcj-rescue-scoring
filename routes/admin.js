// -*- tab-width: 2 -*-
const ObjectId = require('mongoose').Types.ObjectId
const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', function (req, res) {
  res.render('admin_home')
})

router.get('/:competitionid', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('competition_admin', {id : id})
})

router.get('/:competitionid/teams', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('team_admin', {id : id})
})

router.get('/:competitionid/line/runs', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('run_admin', {id : id})
})

router.get('/:competitionid/rounds', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('round_admin', {id : id})
})

router.get('/:competitionid/line/editor', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('line_editor', {id : id})
})

router.get('/:competitionid/fields', function (req, res, next) {
  const id = req.params.competitionid

  if (!ObjectId.isValid(id)) {
    return next()
  }

  res.render('field_admin', {id : id})
})

router.get('/line/tilesets', function (req, res, next) {
  res.render('tileset_admin')
})

module.exports = router
