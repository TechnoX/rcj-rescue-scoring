"use strict"
const express = require('express')
const router = express.Router()
const logger = require('../../config/logger').mainLogger

const mapCtrl = require('../../controllers/map.controller')

router.route('/')
/** POST /api/maps/ - Create map */
  .post(mapCtrl.create)

router.route('/:id')
/** GET /api/maps/:id - Get run */
  .get(mapCtrl.get)
  
  /** PUT /api/maps/:id - Update run */
  .put(mapCtrl.update)
  
  /** DELETE /api/maps/:id - Delete run */
  .delete(mapCtrl.remove)


module.exports = router