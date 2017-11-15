"use strict"
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const logger = require('../config/logger').mainLogger

const leagueSchema = new Schema({
  name: {type: String, required: true, unique: true, index: true}
})

const League = mongoose.model('League', leagueSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.league = League
