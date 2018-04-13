"use strict"
const express = require('express')
const router = express.Router()
const logger = require('../../config/logger').mainLogger

const teamCtrl = require('../../controllers/team.controller')
const runRoute = require('./run.route')

router.route('/')
/** GET /api/maps/ - List teams */
  .get(teamCtrl.list)

  /** POST /api/teams/ - Create team */
  .post(teamCtrl.create)

router.route('/:teamId')
/** GET /api/teams/:id - Get team */
  .get(teamCtrl.get)

  /** PUT /api/teams/:id - Update team */
  .put(teamCtrl.update)

  /** DELETE /api/teams/:id - Delete team */
  .delete(teamCtrl.remove)

router.use('/:teamId/runs', runRoute)


module.exports = router