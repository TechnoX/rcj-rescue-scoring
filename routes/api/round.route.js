"use strict"
const express = require('express')
const router = express.Router()
const logger = require('../../config/logger').mainLogger

const roundCtrl = require('../../controllers/round.controller')
const runRoute = require('./run.route')

router.route('/')
/** GET /api/maps/ - List rounds */
  .get(roundCtrl.list)
  
  /** POST /api/rounds/ - Create round */
  .post(roundCtrl.create)

router.route('/:roundId')
/** GET /api/rounds/:id - Get round */
  .get(roundCtrl.get)
  
  /** PUT /api/rounds/:id - Update round */
  .put(roundCtrl.update)
  
  /** DELETE /api/rounds/:id - Delete round */
  .delete(roundCtrl.remove)

router.use('/:roundId/runs', runRoute)


module.exports = router