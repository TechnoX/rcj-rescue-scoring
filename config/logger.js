// -*- tab-width: 2 -*-
/**
 * Created by roflcopter on 4/14/15.
 *
 * Logger class for stuff
 *
 */
var log4js = require('log4js');
var env = require('node-env-file');
env('process.env');

log4js.configure({
  appenders: [
    { type: 'console'},
    { type: 'file', filename: 'logs/main.log', category: 'main' }
  ]
})

var mainLogger = log4js.getLogger('main');
mainLogger.setLevel(process.env.MAIN_LOG_LVL || 'DEBUG');

module.exports.mainLogger = mainLogger;
