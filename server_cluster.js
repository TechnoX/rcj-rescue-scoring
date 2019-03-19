#!/usr/bin/env node

/**
 * Module dependencies.
 *
 *
 * This is where the app is executed and doing some cool stuff, from the
 * beginning it spawned sub processes but with the module forever it is not needed.
 *
 * For the future and for scalability this needs to be implemented correctly with spawning sub processes
 * for each processor core on the hosted machine. This version of the server does not support shared memory neither
 * does Node.js(87.7% certain). Some alternatives for sharing memory is http://memcached.org or a database containing share variables.
 *
 * To implement and scale this server you'll need to know what variables needs to be shared and so on (GOOD LUCK MUHAAHAHAHAHAHAHAHAHAHAHAHAHAAHAHAH!).
 *
 *
 * ____Taken from app.js______
 * One of the big things to do for scalability is to separate tcp server,static server and application server (api).
 *
 * Right now they are mixed and running on a single core togeather. To be able to use Node.js to 100% the  application
 * part of the server should run alone on an own process. And the static files (CSS, HTML and Javascript(frontend)) should
 * for performance reasons not run on Node.js but on nginx (http://nginx.org/). One of the fastest static servers out there used
 * by many companies. Also it can work as a reverse proxy to support multi Node.js clusters.
 *
 */

var cluster = require('cluster')
var logger = require('./config/logger').mainLogger
var env = require('node-env-file')
var numCPUs = require('os').cpus().length;
env('process.env')

/*
if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
      cluster.fork()
    }

  cluster.on('exit', function(worker, code, signal) {
    // restart process
    logger.error('worker ' + worker.process.pid + ' died')
    logger.info("Forking new child process")
    cluster.fork()
  })
}

else {*/
  var app = require('./app')
  var http = require('http')
  var fs = require('fs')

  /**
   * Get port from environment and store in Express.
   */

  // XXX: Is this used anywhere?
  var port = (parseInt(process.env.WEB_HOSTPORT, 10) || 80) + parseInt(process.env.NODE_APP_INSTANCE || 0);
  app.set('port', port)

  /**
   * Create HTTP server.
   */
  var server = http.createServer(app)

   //https conf

//  var options = {
//     key: fs.readFileSync('./config/ssl/privkey.pem'),
//     cert: fs.readFileSync('./config/ssl/new.cert.cert')
//  }
//  var https = https.createServer(options,app)
//  https.listen(parseInt(process.env.HTTPS_HOSTPORT, 10) || 443)
//  https.on('error', onError)
//  https.on('listening', onListening)


  // socket.io stuff

  var io = require('socket.io')(server)
  var redis = require('socket.io-redis');

  io.adapter(redis({host: 'localhost', port: 6379}));

  io.on('connection', function (socket) {
    socket.on('subscribe', function (data) {
      socket.join(data)
      logger.debug(port +" : Client joined room:" + data)
    })
    socket.on('unsubscribe', function (data) {
      socket.leave(data)
      logger.debug(port +" : Client detached room:" + data)
    })
  })

  require('./routes/api/lineRuns').connectSocketIo(io)
  require('./routes/api/mazeRuns').connectSocketIo(io)
  require('./routes/api/signage').connectSocketIo(io)
  require('./routes/api/kiosk').connectSocketIo(io)

  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(port)
  server.on('error', onError)
  server.on('listening', onListening)


  /**
   * Event listener for HTTP server "error" event.
   */

  function onError(error) {

  if (error.syscall !== 'listen') {
    throw error
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error('Port ' + port + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      logger.error('Port ' + port + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening() {
      logger.info('Webserver listening on port ' + server.address().port)
  }
