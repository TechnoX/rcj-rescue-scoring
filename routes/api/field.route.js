"use strict"
const express = require('express')
const router = express.Router()
const logger = require('../../config/logger').mainLogger

const fieldCtrl = require('../../controllers/field.controller')
const runRoute = require('./run.route')

router.route('/')
/** GET /api/fields/ - List fields */
  .get(fieldCtrl.list)
  
  /** POST /api/fields/ - Create field */
  .post(fieldCtrl.create)

router.route('/:fieldId')
/** GET /api/fields/:id - Get field */
  .get(fieldCtrl.get)
  
  /** PUT /api/fields/:id - Update field */
  .put(fieldCtrl.update)
  
  /** DELETE /api/fields/:id - Delete field */
  .delete(fieldCtrl.remove)

router.use('/:fieldId/runs', runRoute)


module.exports = router