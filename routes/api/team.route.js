"use strict"
const express = require('express')
const router = express.Router()
const logger = require('../../config/logger').mainLogger

const teamCtrl = require('../../controllers/team.controller')

router.route('/')
  /** POST /api/teams/ - Create team */
  .post(teamCtrl.create)

router.route('/:id')
/** GET /api/teams/:id - Get team */
  .get(teamCtrl.get)

  /** PUT /api/teams/:id - Update team */
  .put(teamCtrl.update)

  /** DELETE /api/teams/:id - Delete team */
  .delete(teamCtrl.remove)


module.exports = router