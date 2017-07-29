/**
 * Created by rasmuse on 2015-02-26.
 */

//========================================================================
//                          Libraries
//========================================================================

var passport = require('passport')
var express = require('express')
var router = express.Router()

//========================================================================
//                          /login
//========================================================================

router.get('/', function (req, res) {
  res.render('login');
})


module.exports = router
