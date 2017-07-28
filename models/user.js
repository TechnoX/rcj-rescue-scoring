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

const logger = require('../config/logger').mainLogger
var mongoose = require('mongoose')
var crypto = require('../helper/crypto')
// validator for email and so on
var validator = require('validator')

var timestamps = require('mongoose-timestamp')

var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

const ACCESSLEVELS = {
  SUPERADMIN: 15,
  ADMIN     : 10,
  JUDGE     : 5,
  NONE      : 0
}
module.exports.ACCESSLEVELS = ACCESSLEVELS


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
  username       : {type: String, required: true, unique: true},
  password       : {type: String, /*required: true,*/ select: false},
  salt           : {type: String, select: false},
  admin          : {type: Boolean, default: false}, // deprecated
  superDuperAdmin: {type: Boolean, default: false},
  competitions   : [{
    id         : {
      type    : ObjectId,
      ref     : 'Competition',
      required: true
    },
    accessLevel: {
      type   : Number,
      default: ACCESSLEVELS.NONE,
      min    : ACCESSLEVELS.NONE,
      max    : ACCESSLEVELS.SUPERADMIN,
      /*validate: {
       validator: function (l) {
       return ACCESSLEVELS.indexOf(l) != -1
       }
       }*/
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

//User.remove({}, function (err) {

var testUser = new User({
  username       : "admin",
  //password       : "adminpass",
  admin          : true,
  superDuperAdmin: true
});
var testUser2 = new User({
  username    : "judge",
  //password    : "judgepass",
  competitions: [{
    id         : "5976b89445524f1e629f63f5",
    accessLevel: ACCESSLEVELS.JUDGE
  }, {
    id         : "59759831aa67ba5178a2751e",
    accessLevel: ACCESSLEVELS.JUDGE
  }]
});

User.findOne({username: testUser.username}, function (err, dbUser) {
  if (dbUser) {
    dbUser.password = testUser.password
    dbUser.admin = testUser.admin
    dbUser.superDuperAdmin = testUser.superDuperAdmin
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
    dbUser.password = testUser2.password
    dbUser.admin = testUser2.admin
    dbUser.superDuperAdmin = testUser2.superDuperAdmin
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

//})
