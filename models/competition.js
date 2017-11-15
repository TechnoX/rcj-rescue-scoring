"use strict"
const _ = require('underscore')
const mongoose = require('mongoose')
const idValidator = require('mongoose-id-validator')
const validator = require('validator')
const Schema = mongoose.Schema

const logger = require('../config/logger').mainLogger

const competitionSchema = new Schema({
  name   : {type: String, required: true, unique: true, index: true},
  leagues: [{
    type: ObjectId,
    ref : 'League'
  }]
})

competitionSchema.plugin(idValidator)

const Competition = mongoose.model('Competition', competitionSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.competition = Competition
