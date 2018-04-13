"use strict"
const express = require('express')
const router = express.Router()
const logger = require('../../config/logger').mainLogger

const mapCtrl = require('../../controllers/map.controller')

router.route('/')
/** GET /api/maps/ - List maps */
  .get(mapCtrl.list)

  /** POST /api/maps/ - Create map */
  .post(mapCtrl.create)

router.route('/:mapId')
/** GET /api/maps/:id - Get map */
  .get(mapCtrl.get)
  
  /** PUT /api/maps/:id - Update map */
  .put(mapCtrl.update)
  
  /** DELETE /api/maps/:id - Delete map */
  .delete(mapCtrl.remove)


module.exports = router