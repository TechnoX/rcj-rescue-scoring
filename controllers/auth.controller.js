"use strict"
const User = require('../models/user.model')

/**
 * Configure JWT
 */
const jwt = require('jsonwebtoken') // used to create, sign, and verify tokens
//const config = require('../config') // get config file

module.exports.login = (req, res, next) => {

  // TODO: Move parts of this down to model
  User.findOne({username: req.body.username})
    .select("+password +salt")
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).send('No user found.')
      }
      else {
        // check if the password is valid
        user.comparePassword(req.body.password, (passwordIsValid) => {
            if (!passwordIsValid) return res.status(401).send({
              auth : false,
              token: null
            })

            // if user is found and password is valid
            // create a token
            var token = jwt.sign(
              {
                id          : user._id,
                superAdmin  : user.superAdmin,
                competitions: user.competitions
              },
              'hello world !', // FIXME: Secret
              {expiresIn: 86400} // expires in 24 hours
            )

            // return the information including token as JSON
            return res.status(200).send({auth: true, token: token})
          }
        )
      }
    })
    .catch((err) => {
      return res.status(500).send('Error on the server.')
    })
}

module.exports.logout = (req, res, next) => {
  res.status(200).send({auth: false, token: null})
}