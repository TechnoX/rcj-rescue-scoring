"use strict"
const VerifyToken = require('./VerifyToken')
const User = require('../models/user.model')

/**
 * Configure JWT
 */
const jwt = require('jsonwebtoken') // used to create, sign, and verify tokens
const config = require('../config') // get config file

module.exports.login = (req, res, next) => {

  User.findOne({username: req.body.username}, function (err, user) {
    if (err) return res.status(500).send('Error on the server.')
    if (!user) return res.status(404).send('No user found.')

    // check if the password is valid
    user.comparePassword(req.body.password, (passwordIsValid) => {
      if (!passwordIsValid) return res.status(401).send({
        auth : false,
        token: null
      })

      // if user is found and password is valid
      // create a token
      var token = jwt.sign({id: user._id}, config.secret, {
        expiresIn: 86400 // expires in 24 hours
      })

      // return the information including token as JSON
      res.status(200).send({auth: true, token: token})
    })
  })
}

module.exports.logout = (req, res, next) => {
  res.status(200).send({auth: false, token: null})
}