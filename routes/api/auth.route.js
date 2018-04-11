//========================================================================
//                          Libraries
//========================================================================

var express = require('express')
var router = express.Router()
var validator = require('validator')
const authCtrl = require('../../controllers/auth.controller')
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
router.post('/login', authCtrl.login)

/**
 * @api {get} /auth/logout Request logout
 * @apiName GetLogout
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * @apiDescription This function is used for logging out. This means you are cleared from the server, so even
 * though the cookie is left it doesnt know you.
 *
 */
router.get('/logout', authCtrl.logout)

module.exports = router
