// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var ObjectId = require('mongoose').Types.ObjectId
const auth = require('../helper/authLevels')
const ruleDetector = require('../helper/ruleDetector')
const ACCESSLEVELS = require('../models/user').ACCESSLEVELS

/* GET home page. */
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


publicRouter.get('/view/:runid', async function (req, res, next) {
    const id = req.params.runid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    let rule = await ruleDetector.getRuleFromMazeRunId(id);
    res.render('maze_view', {
        id: id,
        user: req.user,
        rule: rule
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

privateRouter.get('/judge/:runid', async function (req, res, next) {
    const id = req.params.runid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    let rule = await ruleDetector.getRuleFromMazeRunId(id);
    res.render('maze_judge', {
        id: id,
        user: req.user,
        rule: rule
    })
})

privateRouter.get('/sign/:runid', async function (req, res) {
    const id = req.params.runid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    let rule = await ruleDetector.getRuleFromMazeRunId(id);
    res.render('maze_sign', {
        id: id,
        rule: rule
    })
})

adminRouter.get('/approval/:roundid', async function (req, res) {
    const id = req.params.roundid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    let rule = await ruleDetector.getRuleFromMazeRunId(id);
    res.render('maze_approval', {
        id: id,
        rule: rule
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
