const env = require('node-env-file')
env('../process.env')

const db = require('../config/db')

require('./' + process.argv[2])