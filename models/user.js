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

var env = require('node-env-file');
env('process.env');

var mongoose = require('mongoose');
var crypto = require('../helper/crypto');
// validator for email and so on
var validator = require('validator');

var timestamps = require('mongoose-timestamp');

var Schema = mongoose.Schema;

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
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true, select: false},
  salt: {type: String, select: false},
  admin: {type: Boolean, required: true}
});

/**
 * Method used for pre saving.
 *
 * @function pre
 * @this userSchema
 *
 */
userSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next()
  }
  else {
    var user = this;
    crypto.generateHashWithSalt(user.password, function (err, hashedString, saltUsed) {
      user.salt = saltUsed;
      user.password = hashedString;

      return next();
    })
  }
});

/**
 * Method used for updating the password. If you want to update the password use this metod, do not
 * use .save() method. Since it doesn't take care of salt and so on.
 *
 * @alias module:models/user.updatePassword
 * @this user
 * @param {String} password - The password you want
 * @param {updatePasswordCb} cb - The callback function
 */
userSchema.methods.updatePassword = function (password, cb) {
  var user = this;

  crypto.generateHashWithSalt(password, function (err, hashedString, saltUsed) {
    console.log(err);
    if (err) {
      return cb(err);
    }

    user.salt = saltUsed;
    user.password = hashedString;
    user.save();

    return cb(null);
  })
}

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
var User = mongoose.model('User', userSchema);

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.user = User;


var testUser = new User({
  username: process.env.user,
  password: process.env.password,
  admin: true
});

testUser.save(function (err, data) {
  if (err) {
    //  console.log(err);
  }
  else {
    console.log("saved admin user for the first time, this will only get saved if it is a new installation");
  }
});
