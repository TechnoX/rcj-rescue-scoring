// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var ObjectId = require('mongoose').Types.ObjectId
const auth = require('../helper/authLevels')
const ACCESSLEVELS = require('../models/user').ACCESSLEVELS

/* GET home page. */
publicRouter.get('/', function (req, res) {
    res.render('maze_home', {
        user: req.user
    });
})
publicRouter.get('/:competitionid', function (req, res, next) {
    const id = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)) res.render('maze_competition', {id: id, user: req.user, judge: 1})
    else res.render('maze_competition', {id: id, user: req.user, judge: 0})
})

publicRouter.get('/:competitionid/score', function (req, res, next) {
    const id = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }

    res.render('maze_score', {
        id: id,
        get: req.query,
        user: req.user
    })
})

publicRouter.get('/view/:runid', function (req, res, next) {
    const id = req.params.runid

    if (!ObjectId.isValid(id)) {
        return next()
    }

    res.render('maze_view', {
        id: id
    })
})


publicRouter.get('/viewcurrent', function (req, res) {
    res.render('maze_view_current')
})


publicRouter.get('/view/field/:competitionid/:fieldid', function (req, res) {
    const id = req.params.fieldid
    const cid = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    res.render('maze_view_field', {
        id: id,
        cid: cid
    })
})

privateRouter.get('/judge/:runid', function (req, res, next) {
    const id = req.params.runid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    res.render('maze_judge', {
        id: id,
        user: req.user
    })
})

privateRouter.get('/sign/:runid', function (req, res) {
    res.render('maze_sign', {
        id: req.params.runid
    })
})

adminRouter.get('/approval/:roundid', function (req, res) {
    const id = req.params.roundid

    if (!ObjectId.isValid(id)) {
        return next()
    }

    res.render('maze_approval', {
        id: id
    })
})


publicRouter.all('*', function (req, res, next) {
    next()
})
privateRouter.all('*', function (req, res, next) {
    next()
})

module.exports.public = publicRouter
module.exports.private = privateRouter
module.exports.admin = adminRouter
