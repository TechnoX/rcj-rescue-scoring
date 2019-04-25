// -*- tab-width: 2 -*-
var express = require('express')
var router = express.Router()
var ObjectId = require('mongoose').Types.ObjectId


/* GET home page. */
router.get('/', function (req, res) {
  res.render('home', {user: req.user});
})

router.get('/:competitionid', function (req, res, next) {
  const id = req.params.competitionid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  res.render('competition_home', {id: id, user: req.user})
})

router.get('/access_denied', function (req, res) {
  res.render('access_denied', {user: req.user});
})

module.exports = router
