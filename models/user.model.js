/**
 * <p>User schema</p>
 *
 * @module models/user
 */

/**
 * Mongoose ObjectId
 * @external ObjectId
 * @see {@link http://mongoosejs.com/docs/api.html#schema-objectid-js}
 */

/**
 * Javascript Date
 * @external Date
 * @see {@link http://www.w3schools.com/jsref/jsref_obj_date.asp}
 */

/**
 * @callback updatePasswordCb
 * @param {Error} err Error if someting went wrong, otherwise null.
 */

/**
 * @callback comparePasswordCb
 * @param {Boolean} res True or false if it matched
 */

/**
 * @callback generateInviteCb
 * @param {Error} err If there was an error, null if not
 * @param {Token} token The generated token, null if error
 */

var env = require('node-env-file')
env('process.env')

const _ = require('lodash');
const logger = require('../config/logger').mainLogger
var mongoose = require('mongoose')
var crypto = require('../helpers/crypto')
// validator for email and so on
var validator = require('validator')

var timestamps = require('mongoose-timestamp')

var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

const ROLES = require('../helpers/accessLevels').ROLES


/**
 *
 *@constructor
 *
 * @param {String} username - The username
 * @param {String} password - The password
 * @param {String} salt - The salt used, unique for every user
 * @param {Boolean} admin - If the user is admin or not
 */
var userSchema = new Schema({
  username    : {type: String, required: true, unique: true},
  password    : {type: String, required: true, select: false},
  salt        : {type: String, select: false},
  superAdmin  : {type: Boolean, default: false},
  competitions: [{
    id         : {
      type    : ObjectId,
      ref     : 'Competition',
      required: true
    },
    role: {
      type   : String,
      default: ROLES.NONE,
      enum   : _.values(ROLES)
    }
  }]
  
});

/**
 * Method used for pre saving.
 *
 * @function pre
 * @this userSchema
 *
 */
userSchema.pre('save', function (next) {
  if (this.isNew || this.isModified("password")) {
    var user = this;
    crypto.generateHashWithSalt(user.password, function (err, hashedString, saltUsed) {
      user.salt = saltUsed;
      user.password = hashedString;
      
      return next();
    })
  } else {
    return next()
  }
})

/**
 * Method used for checking if the password matches the user
 *
 * @alias module:models/user.updatePassword
 * @this user
 * @param {String} candidatePassword - The password you want to check
 * @param {comparePassword} cb - The callback function
 */
userSchema.methods.comparePassword = function (candidatePassword, cb) {
  crypto.compareHash(this.password, candidatePassword, this.salt, function (res) {
    return cb(res);
  })
}

userSchema.plugin(timestamps);

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const User = module.exports = mongoose.model('User', userSchema)

//User.remove({}, function (err) {

var testUser = new User({
  username  : "admin",
  password  : "adminpass",
  superAdmin: true
});
var testUser2 = new User({
  username    : "judge",
  //password    : "judgepass",
  competitions: [{
    id         : "5976b89445524f1e629f63f5",
    role: ROLES.JUDGE
  }, {
    id         : "59759831aa67ba5178a2751e",
    role: ROLES.JUDGE
  }]
});

User.findOne({username: testUser.username}, function (err, dbUser) {
  if (dbUser) {
    if (testUser.password != null) {
      dbUser.password = testUser.password
    }
    dbUser.superAdmin = testUser.superAdmin
    dbUser.competitions = testUser.competitions
    
    //logger.debug(dbUser)
    
    dbUser.save(function (err) {
      if (err) {
        logger.error(err)
      }
    })
  } else {
    testUser.save(function (err) {
      if (err) {
        logger.error(err)
      }
      else {
        console.log("saved admin user for the first time, this will only get saved if it is a new installation");
      }
    });
  }
})

User.findOne({username: testUser2.username}, function (err, dbUser) {
  if (dbUser) {
    if (testUser2.password != null) {
      dbUser.password = testUser2.password
    }
    dbUser.superAdmin = testUser2.superAdmin
    dbUser.competitions = testUser2.competitions
    
    dbUser.save(function (err) {
      if (err) {
        logger.error(err)
      }
    })
  } else {
    testUser2.save(function (err) {
      if (err) {
        logger.error(err)
      }
      else {
        console.log("saved judge user for the first time, this will only get saved if it is a new installation");
      }
    });
  }
})
