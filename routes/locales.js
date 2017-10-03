// -*- tab-width: 2 -*-
var express = require('express')
var router = express.Router()


router.get('/', function (req, res) {
    res.render('locales', {
        user: req.user
    });
})

module.exports = router
