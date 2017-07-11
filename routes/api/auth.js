//========================================================================
//                          Libraries
//========================================================================

var express = require('express');
var router = express.Router();
var validator = require('validator')
var userdb = require('../../models/user')
var passport = require('passport')
var logger = require('../../config/logger').mainLogger;

//========================================================================
//                          auth(mixed) Api endpoints
//========================================================================

/**
 * @api {post} /auth/login Request login
 * @apiName PostLogin
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * @apiDescription This authentication method uses cookies and for that you need suppot for cookies. The complete
 * return is in the cookie header. This is not the best way to do it (should use oauth2).
 *
 * @apiParam {String} username Username
 * @apiParam {String} password Password
 *
 * @apiSuccess (200) {String}   msg Bottled message
 *
 * @apiSuccess (400) {String}   msg Bottled message
 */
router.post('/login', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  
  if (!validator.isAscii(password) || !validator.isAscii(username)) {
    return res.status(400).send({msg: "Invalid characters"})
  }

  else {
    passport.authenticate('local', function (err, user, info) {
      if (err) {
        //return next(err);
        logger.error(err)
        return res.status(400).send({msg: err})
      }
      if (!user) {
        return res.status(400).send({msg: "Login failed"})
      }
      req.logIn(user, function (err) {
        if (err) {
          logger.error(err)
          return res.status(400).send({msg: err})
        }
        res.locals.user = username
        return res.send({msg: "Login successful"})
      });
    })(req, res);
  }
})

/**
 * @api {get} /auth/logout Request logout
 * @apiName GetLogout
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * @apiDescription This function is used for logging out. This means you are cleared from the server, so even
 * though the cookie is left it doesnt know you.
 *
 */
router.get('/logout', function (req, res) {
  req.logout();
  res.send({msg: "Logout successful", status: true});
});

module.exports = router;
