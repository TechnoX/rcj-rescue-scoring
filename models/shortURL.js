const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger


const shortURLSchema = new Schema({
  name       : {type: String, required: true},
  shorted    : {type: String, required: true},
  transfer   : {type: String, required: true}
})

shortURLSchema.pre('save', function (next) {
  const self = this
  if (self.isNew) {
    shortURL.findOne({
      shorted       : self.shorted
    }, function (err, dbURL) {
      if (err) {
        return next(err)
      } else if (dbURL) {
        err = new Error('URL shorting setting :"' + self.shorted + '" already exists!')
        return next(err)
      } else {
        return next()
      }
    })
  } else {
    return next()
  }
})




const shortURL = mongoose.model('shortURL', shortURLSchema)


/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.shortURL = shortURL

