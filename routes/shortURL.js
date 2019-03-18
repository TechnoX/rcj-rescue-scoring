// -*- tab-width: 2 -*-
var express = require('express')
var publicRouter = express.Router()

const urlDb = require('../models/shortURL')

const logger = require('../config/logger').mainLogger

/* GET home page. */

publicRouter.get('/:name', function (req, res, next) {
    const name = req.params.name
    if(name){
      urlDb.shortURL.findOne({
        shorted : name
      }).lean().exec(function (err, data) {
        if (err) {
          logger.error(err)
          res.status(400).send({
            msg: "Could not get data",
            err: err.message
          })
        } else {
          if(data){
            res.redirect(data.transfer)
          }else{
            res.render('shortURL404', {user: req.user})
          }
        }
      })
    }else {
      next()
    }
})




publicRouter.all('*', function (req, res, next) {
  next()
})


module.exports.public = publicRouter
