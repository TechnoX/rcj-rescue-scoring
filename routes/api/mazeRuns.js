"use strict"
const express = require('express')
const multer = require('multer')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const mazeRun = require('../../models/mazeRun').mazeRun
const mazeMap = require('../../models/mazeMap').mazeMap
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const scoreCalculator = require('../../helper/scoreCalculator')
const scoreSheetPDF = require('../../helper/scoreSheetPDFMaze');
const scoreSheetProcessMaze = require('../../helper/scoreSheetProcessMaze');
const scoreSheetProcessUtil = require('../../helper/scoreSheetProcessUtil');
const auth = require('../../helper/authLevels')
const ACCESSLEVELS = require('../../models/user').ACCESSLEVELS

var socketIo

module.exports.connectSocketIo = function (io) {
    socketIo = io
}

/**
 * @api {get} /runs/maze Get runs
 * @apiName GetRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {Boolean} [populate] Whether to populate references with name
 *
 * @apiSuccess (200) {Object[]} -             Array of runs
 * @apiSuccess (200) {String}   -._id
 * @apiSuccess (200) {String}   -.competition
 * @apiSuccess (200) {String}   -.round
 * @apiSuccess (200) {String}   -.team
 * @apiSuccess (200) {String}   -.field
 * @apiSuccess (200) {String}   -.map
 * @apiSuccess (200) {Number}   -.score
 * @apiSuccess (200) {Object}   -.time
 * @apiSuccess (200) {Number}   -.time.minutes
 * @apiSuccess (200) {Number}   -.time.seconds
 *
 * @apiError (400) {String} msg The error message
 */
publicRouter.get('/', getMazeRuns)

function getMazeRuns(req, res) {
    const competition = req.query.competition || req.params.competition

    var query
    if (competition != null && competition.constructor === String) {
        if (req.query['ended'] == 'false') {
            query = mazeRun.find({
                competition: competition,
                status: {
                    $lte: 1
                }
            })
        } else {
            query = mazeRun.find({
                competition: competition
            })
        }
    } else if (Array.isArray(competition)) {
        query = mazeRun.find({
            competition: {
                $in: competition.filter(ObjectId.isValid)
            }
        })
    } else {
        query = mazeRun.find({})
    }

    if (req.query['minimum']) {
        query.select("competition round team field status started startTime sign")
    }else if (req.query['timetable']) {
        query.select("round team field startTime group")
        query.populate([
            {
                path: "team",
                select: "name league"
      },
            {
                path: "round",
                select: "name"
      },
            {
                path: "field",
                select: "name league"
      }
    ])
    }  else {
        query.select("competition round team field map score time status started comment startTime sign LoPs exitBonus foundVictims")
    }


    if (req.query['populate'] !== undefined && req.query['populate']) {
        query.populate([
            {
                path: "competition",
                select: "name"
      },
            {
                path: "round",
                select: "name"
      },
            {
                path: "team",
                select: "name"
      },
            {
                path: "field",
                select: "name"
      },
            {
                path: "map",
                select: "name"
      }
    ])
    }

    query.lean().exec(function (err, dbRuns) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get runs",
                err: err.message
            })
        } else if (dbRuns) {
            // Hide map and field from public
            for (let i = 0; i < dbRuns.length; i++) {
                var authResult = auth.authViewRun(req.user, dbRuns[i], ACCESSLEVELS.VIEW)
                if (authResult == 0) {
                    return res.status(403)
                } else if (authResult == 2) {
                    delete dbRuns[i].comment
                    delete dbRuns[i].sign
                }
            }
            res.status(200).send(dbRuns)
        }
    })
}
module.exports.getMazeRuns = getMazeRuns

adminRouter.get('/recalculate', function (req, res, next) {
  const competition = req.query.competition || req.params.competition

  var query
  if (competition != null && competition.constructor === String) {

  }else{
    return res.status(400).send({
      msg: "competition=?"
    })
  }


  mazeRun.find({
    competition: competition,
    status: {
      $gte: 6
    }
  })
    .populate(["map","competition"])
    .exec(function (err, dbRuns) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get runs",
        err: err.message
      })
    } else if (dbRuns) {
      for (let i = 0; i < dbRuns.length; i++) {
        let retScoreCals = scoreCalculator.calculateMazeScore(dbRuns[i]).split(",")

        mazeRun.findById(dbRuns[i]._id)
          .exec(function (err, dbRun) {
            dbRun.score = retScoreCals[0]
            dbRun.foundVictims = retScoreCals[1]
            dbRun.distKits = retScoreCals[2]

            dbRun.save(function (err) {
              if (err) {
                logger.error(err)
              } else {
                logger.info(retScoreCals[0]);
              }
            })
          })
      }
      return res.status(200).send({
        msg: "Updated scores"
      })
      /*res.status(200).send({
        msg: dbRuns
        //err: err.message
      })*/

    }
  })
})

publicRouter.get('/latest', getLatestMazeRun)

function getLatestMazeRun(req, res) {
    const competition = req.query.competition || req.params.competition
    const field = req.query.field || req.params.field
    const fields = req.query.fields

    var selection = {
        competition: competition,
        field: field
    }
    if (selection.competition == undefined) {
        delete selection.competition
    }
    if (selection.field == undefined) {
        delete selection.field
    }

    if (fields != null) {
        selection.field = {
            $in: fields
        }
    }

    var query = mazeRun.findOne(selection).sort("-updatedAt")

    if (req.query['populate'] !== undefined && req.query['populate']) {
        query.populate(["round", "team", "field", "competition"])
    }

    query.lean().exec(function (err, dbRun) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get run"
            })
        } else if (dbRun) {
            // Hide map and field from public
            if (!auth.authViewRun(req.user, dbRun, ACCESSLEVELS.NONE + 1)) {
                delete dbRun.map
                delete dbRun.field
                delete dbRun.comment
                delete dbRun.sign
            }
            return res.status(200).send(dbRun)
        }
    })
}
module.exports.getLatestMazeRun = getLatestMazeRun;

adminRouter.get('/nextApproval/:competitionid', function (req, res, next) {
  var id = req.params.competitionid
  if (!ObjectId.isValid(id)) {
    return next()
  }
  var query = mazeRun.findOne({
    competition: id,
    status     : 4
  })
  query.exec(function (err, data) {
    if (err) {
      logger.error(err)
      return res.status(400).send({
        msg: "Could not get runs"
      })
    } else {
      if(data){
        data.status = 5;
        data.save(function (err) {
          if (err) {
            logger.error(err)
            return res.status(400).send({
              err: err.message,
              msg: "Could not save run"
            })
          } else {
            if (socketIo !== undefined) {
              socketIo.sockets.in('runs/maze').emit('changed')
              socketIo.sockets.in('competition/' +
                data.competition).emit('changed')
              socketIo.sockets.in('runs/' + data._id).emit('data', data)
              socketIo.sockets.in('fields/' +
                data.field).emit('data', {
                newRun: data._id
              })
            }
            return res.status(200).send(data._id);
          }

        })
      }else {
        return res.status(400).send({
          msg: "Could not get runs"
        });
      }
    }
  })
})



publicRouter.get('/find/:competitionid/:field/:status', function (req, res, next) {
    var id = req.params.competitionid
    var field_id = req.params.field
    var status = req.params.status
    if (!ObjectId.isValid(id)) {
        return next()
    }
    if (!ObjectId.isValid(field_id)) {
        return next()
    }
    var query = mazeRun.find({
        competition: id,
        field: field_id,
        status: status
    }, "field team competition status")
    query.populate(["team"])
    query.exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get runs"
            })
        } else {
            res.status(200).send(data)
        }
    })
})


/**
 * @api {get} /runs/maze/:runid Get run
 * @apiName GetRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {String} runid The run id
 *
 * @apiParam {Boolean} [populate] Whether to populate object references
 *
 * @apiSuccess (200) {String}       _id
 * @apiSuccess (200) {String}       competition
 * @apiSuccess (200) {String}       round
 * @apiSuccess (200) {String}       team
 * @apiSuccess (200) {String}       field
 * @apiSuccess (200) {String}       map
 *
 * @apiSuccess (200) {Object[]}     tiles
 * @apiSuccess (200) {Boolean}      tiles.isDropTile
 * @apiSuccess (200) {Object}       tiles.scoredItems
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.obstacles
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.speedbumps
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.intersection
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.gaps
 * @apiSuccess (200) {Boolean}      tiles.scoredItems.dropTile
 * @apiSuccess (200) {Number[]}     LoPs
 * @apiSuccess (200) {Number}       evacuationLevel
 * @apiSuccess (200) {Boolean}      exitBonus
 * @apiSuccess (200) {Number}       rescuedLiveVictims
 * @apiSuccess (200) {Number}       rescuedDeadVictims
 * @apiSuccess (200) {Number}       score
 * @apiSuccess (200) {Boolean}      showedUp
 * @apiSuccess (200) {Object}       time
 * @apiSuccess (200) {Number{0-8}}  time.minutes
 * @apiSuccess (200) {Number{0-59}} time.seconds
 *
 * @apiError (400) {String} err The error message
 * @apiError (400) {String} msg The error message
 */
publicRouter.get('/:runid', function (req, res, next) {
    const id = req.params.runid

    if (!ObjectId.isValid(id)) {
        return next()
    }

    const query = mazeRun.findById(id, "-__v")

    if (req.query['populate'] !== undefined && req.query['populate']) {
        query.populate(["round", "team", "field", "competition"])
    }

    query.lean().exec(function (err, dbRun) {
        if (err) {
            logger.error(err)
            return res.status(400).send({
                msg: "Could not get run",
                err: err.message
            })
        } else {
            // Hide map and field from public
            // Hide map and field from public
            var authResult = auth.authViewRun(req.user, dbRun, ACCESSLEVELS.VIEW)
            if (authResult == 0) {
                return res.status(401).send({
                    msg: "You have no authority to access this api!!"
                })
            } else if (authResult == 2) {
                delete dbRun.comment
                delete dbRun.sign
            }
            return res.status(200).send(dbRun)
        }
    })
})

/**
 * @api {put} /runs/maze/:runid Update run
 * @apiName PutRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {String} runid The run id

 * @apiParam {Object[]}     [tiles]
 * @apiParam {Boolean}      [tiles.isDropTile]
 * @apiParam {Object}       [tiles.scoredItems]
 * @apiParam {Boolean}      [tiles.scoredItems.obstacles]
 * @apiParam {Boolean}      [tiles.scoredItems.speedbumps]
 * @apiParam {Boolean}      [tiles.scoredItems.intersection]
 * @apiParam {Boolean}      [tiles.scoredItems.gaps]
 * @apiParam {Boolean}      [tiles.scoredItems.dropTile]
 * @apiParam {Number[]}     [LoPs]
 * @apiParam {Number=1,2}   [evacuationLevel]
 * @apiParam {Boolean}      [exitBonus]
 * @apiParam {Number}       [rescuedLiveVictims]
 * @apiParam {Number}       [rescuedDeadVictims]
 * @apiParam {Boolean}      [showedUp]
 * @apiParam {Object}       [time]
 * @apiParam {Number{0-8}}  [time.minutes]
 * @apiParam {Number{0-59}} [time.seconds]
 *
 * @apiSuccess (200) {String} msg   Success msg
 * @apiSuccess (200) {String} score The current score
 *
 * @apiError (400) {String} err The error message
 * @apiError (400) {String} msg The error message
 */
privateRouter.put('/:runid', function (req, res, next) {
    const id = req.params.runid
    if (!ObjectId.isValid(id)) {
        return next()
    }

    const run = req.body

    var statusUpdate = false;
    // Exclude fields that are not allowed to be publicly changed
    delete run._id
    delete run.__v
    delete run.map
    delete run.competition
    delete run.round
    delete run.team
    delete run.field
    delete run.score

    //logger.debug(run)

    mazeRun.findById(id)
        //.select("-_id -__v -competition -round -team -field -score")
        .populate(["map","competition"])
        .exec(function (err, dbRun) {
            if (err) {
                logger.error(err)
                res.status(400).send({
                    msg: "Could not get run",
                    err: err.message
                })
            } else {
                if(!dbRun)
                    return res.status(400).send({
                        msg: "Could not get run"
                    })
                if (!auth.authCompetition(req.user, dbRun.competition._id, ACCESSLEVELS.JUDGE)) {
                    return res.status(401).send({
                        msg: "You have no authority to access this api!!"
                    })
                }

                // Recursively updates properties in "dbObj" from "obj"
                const copyProperties = function (obj, dbObj) {
                    for (let prop in obj) {
                        if (obj.hasOwnProperty(prop) && (dbObj.hasOwnProperty(prop) ||
                                dbObj.get(prop) !== undefined)) { // Mongoose objects don't have hasOwnProperty
                            if (typeof obj[prop] == 'object' && dbObj[prop] != null) { // Catches object and array
                                copyProperties(obj[prop], dbObj[prop])

                                if (dbObj.markModified !== undefined) {
                                    dbObj.markModified(prop)
                                }
                            } else if (obj[prop] !== undefined) {
                                //logger.debug("copy " + prop)
                                dbObj[prop] = obj[prop]
                            }
                        } else {
                            return new Error("Illegal key: " + prop)
                        }
                    }
                }

                for (let i in run.tiles) {
                    if (run.tiles.hasOwnProperty(i)) {
                        let tile = run.tiles[i]
                        delete tile.processing

                        if (isNaN(i)) {
                            const coords = i.split(',')
                            tile.x = Number(coords[0])
                            tile.y = Number(coords[1])
                            tile.z = Number(coords[2])
                        }

                        let existing = false
                        for (let j = 0; j < dbRun.tiles.length; j++) {
                            let dbTile = dbRun.tiles[j]
                            //logger.debug(tile)
                            //logger.debug(dbTile)
                            if (tile.x == dbTile.x && tile.y == dbTile.y &&
                                tile.z == dbTile.z) {
                                existing = true
                                err = copyProperties(tile, dbTile)
                                dbRun.markModified("tiles")
                                if (err) {
                                    logger.error(err)
                                    return res.status(400).send({
                                        err: err.message,
                                        msg: "Could not save run"
                                    })
                                }
                                break
                            }
                        }
                        if (!existing) {
                            dbRun.tiles.push(tile)
                            dbRun.markModified("tiles")
                        }
                    }
                }

                delete run.tiles
                
                if (run.status){
                    if(dbRun.status > run.status) delete run.status;
                    else{
                        if(run.status != dbRun.status) statusUpdate = true;
                    }
                }
                
                
                

                err = copyProperties(run, dbRun)
                if (err) {
                    logger.error(err)
                    return res.status(400).send({
                        err: err.message,
                        msg: "Could not save run"
                    })
                }
                var retScoreCals = scoreCalculator.calculateMazeScore(dbRun).split(",")

                dbRun.score = retScoreCals[0]
                dbRun.foundVictims = retScoreCals[1]
                dbRun.distKits = retScoreCals[2]

                if (dbRun.score > 0 || dbRun.time.minutes != 0 ||
                    dbRun.time.seconds != 0 || dbRun.status >= 2) {
                    dbRun.started = true
                } else {
                    dbRun.started = false
                }

                dbRun.save(function (err) {
                    if (err) {
                        logger.error(err)
                        return res.status(400).send({
                            err: err.message,
                            msg: "Could not save run"
                        })
                    } else {
                        if (socketIo !== undefined) {
                            delete dbRun.sign;
                            socketIo.sockets.in('runs/maze/' + dbRun.competition).emit('changed')
                            socketIo.sockets.in('runs/' + dbRun._id).emit('data', dbRun)
                            if(statusUpdate){
                                socketIo.sockets.in('runs/maze/' + dbRun.competition + '/status').emit('Mchanged')
                            }
                        }
                        return res.status(200).send({
                            msg: "Saved run",
                            score: dbRun.score
                        })
                    }
                })
            }
        })
})

/**
 * @api {get} /scoreSheet Generate scoring sheets
 * @apiName GetScoringSheet
 * @apiGroup Get
 * @apiVersion 1.0.1
 *
 * @apiSuccess (200) {String}   "Ok"
 *
 * @apiError (400) {String} msg The error message
 */
adminRouter.get('/scoresheet', function (req, res, next) {
  const run = req.query.run || req.params.run;
  const competition = req.query.competition || req.params.competition;
  const field = req.query.field || req.params.field;
  const round = req.query.round || req.params.round;
  const startTime = req.query.startTime || req.params.startTime;
  const endTime = req.query.endTime || req.params.endTime;

  if (!competition && !run && !round) {
    return next();
  }

  let queryObj = {};
  let sortObj = {};
  if (ObjectId.isValid(competition)) {
    queryObj.competition = ObjectId(competition);
  }
  if (ObjectId.isValid(field)) {
    queryObj.field = ObjectId(field);
  }
  if (ObjectId.isValid(round)) {
    queryObj.round = ObjectId(round);
  }
  if (ObjectId.isValid(run)) {
    queryObj._id = ObjectId(run);
  }

  sortObj.field = 1;
  sortObj.startTime = 1; // sorting by field has the highest priority, followed by time

  if (startTime && endTime) {
    queryObj.startTime = {$gte: parseInt(startTime), $lte: parseInt(endTime)}
  } else {
    if (startTime) {
      queryObj.startTime = {$gte: parseInt(startTime)}
    } else if (endTime) {
      queryObj.startTime = {$lte: parseInt(endTime)}
    }
  }

  var query = mazeRun.find(queryObj).sort(sortObj);

  query.select("competition round team field map startTime tiles")
  query.populate([
    {
      path  : "competition",
      select: "name rule"
    },
    {
      path  : "round",
      select: "name"
    },
    {
      path  : "team",
      select: "name"
    },
    {
      path  : "field",
      select: "name"
    },
    {
      path  : "map",
      select: "name height width length startTile cells dice",
      populate: {
          path: "dice"
      }
    }
  ])

  query.lean().exec(function (err, dbRuns) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get runs"
      })
    } else if (dbRuns) {
      for (let i = 0; i < dbRuns.length; i++) {
        if (dbRuns[i].tiles.length === 0) {
          let randomMapIndex = Math.floor(Math.random() * dbRuns[i].map.dice.length);
          dbRuns[i].map = dbRuns[i].map.dice[randomMapIndex];
        }
      }
      let posData = scoreSheetPDF.generateScoreSheet(res, dbRuns);
      for (let i = 0; i < dbRuns.length; i++) {
        mazeRun.findById(dbRuns[i]._id, (err, run) => {
          if (err) {
            logger.error(err)
            res.status(400).send({
              msg: "Could not get run",
              err: err.message
            })
          } else {
            run.scoreSheet.positionData = posData[i];
            run.save((err) => {
              if (err) {
                logger.error(err)
                res.status(400).send({
                  msg: "Error saving positiondata of run in db",
                  err: err.message
                })
              }
            })
          }
        })
      }
    }
  })
})

/**
 * Upload scoring sheet (single (jpg/png) or bunch (pdf)
 */
adminRouter.post('/scoresheet/:competition', function (req, res) {
  const competition = req.params.competition;

  let pathname = "tmp/";
  fs.mkdir(pathname, function (err) {
    if (err && err.code !== 'EEXIST') {
      console.log(err);
      return res.status(400).send({
        msg: "Error creating tmp dir",
        err: err.message
      })
    }
  });

  let storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, pathname)
    },
    filename: function (req, file, callback) {
      callback(null, "scoringsheet_" + Math.random().toString(36).substr(2, 10) + file.originalname)
    }
  });

  let upload = multer({
    storage: storage
  }).single('file');

  upload(req, res, function (err) {
    if (err) {
      return res.status(400).send({
        msg: "Error uploading file",
        //err: err.message
      })
    }
    let sheetRunID = scoreSheetProcessUtil.processPosdataQRFull(req.file.path);
    if (sheetRunID == null) {
      return res.status(400).send({
        msg: "Error processing file",
        //err: err.message
      })
    }

    mazeRun.findById(ObjectId(sheetRunID)).populate([{
      path    : 'map',
      populate: {
        path: 'tiles.tileType'
      }
    },"competition"]).exec(function(err, run) {
      if (err) {
        logger.error(err)
        res.status(400).send({
          msg: "Could not get run",
          //err: err.message
        })
      } else {
        const sheetData = scoreSheetProcessMaze.processScoreSheet(run.competition.rule ,run.scoreSheet.positionData, req.file.path);

        run.scoreSheet.fullSheet = sheetData.rawSheet;
        run.scoreSheet.specialAttention = false;

        run.LoPs = sheetData.lops.indexes[0] * 10 + sheetData.lops.indexes[1];
        run.scoreSheet.LoPImage = sheetData.lops.img;

        if(sheetData.misidentification){  //for 2019 rule
          run.misidentification = sheetData.misidentification.indexes[0] * 10 + sheetData.misidentification.indexes[1];
          run.scoreSheet.misidentificationImage = sheetData.misidentification.img;
        }

        run.time.minutes = sheetData.time.indexes[0];
        if (run.time.minutes > 8) {
          run.time.minutes = 8;
          run.scoreSheet.specialAttention = true;
        }
        run.time.seconds = sheetData.time.indexes[1] * 10 + sheetData.time.indexes[2];
        if (run.time.seconds > 59) {
          run.time.seconds = 59;
          run.scoreSheet.specialAttention = true;
        }
        run.scoreSheet.timeImage = sheetData.time.img;

        run.exitBonus = sheetData.exitBonus.indexes[0] === 0;
        run.scoreSheet.exitBonusImage = sheetData.exitBonus.img;

        run.tiles = [];
        for (let i = 0; i < run.map.cells.length; i++) {
          // First store the run tiles so that they are all accessible. Tiles without items are not listed in sheetData.tiles.tilesData
          if (!run.map.cells[i].isTile) {
            continue;
          }

          run.tiles.push({
            x: run.map.cells[i].x, y: run.map.cells[i].y, z: run.map.cells[i].z
          });
        }

        for (let i = 0; i < sheetData.tiles.tilesData.length; i++) {
          for (let j = 0; j < sheetData.tiles.tilesData[i].length; j++) {
            let tileData = sheetData.tiles.tilesData[i][j];

            if (!tileData.checked) {
                continue;
            }
            switch (tileData.meta.id) {
              case "checkpoint":
                run.tiles[i].scoredItems.checkpoint = true;
                break;
              case "speedbump":
                run.tiles[i].scoredItems.speedbump = true;
                break;
              case "rampBottom":
                run.tiles[i].scoredItems.rampBottom = true;
                break;
              case "rampTop":
                run.tiles[i].scoredItems.rampTop = true;
                break;
              case "victims.top":
                run.tiles[i].scoredItems.victims.top = true;
                break;
              case "victims.right":
                run.tiles[i].scoredItems.victims.right = true;
                break;
              case "victims.bottom":
                run.tiles[i].scoredItems.victims.bottom = true;
                break;
              case "victims.left":
                run.tiles[i].scoredItems.victims.left = true;
                break;
              case "rescueKits.top":
                run.tiles[i].scoredItems.rescueKits.top++;
                break;
              case "rescueKits.right":
                run.tiles[i].scoredItems.rescueKits.right++;
                break;
              case "rescueKits.bottom":
                run.tiles[i].scoredItems.rescueKits.bottom++;
                break;
              case "rescueKits.left":
                run.tiles[i].scoredItems.rescueKits.left++;
                break;
            }
          }
        }
        run.scoreSheet.tileDataImage = sheetData.tiles.img;

        run.comment = sheetData.hasComment.indexes[0] === 0 ? "Comments on sheet" : "";
        run.acceptResult = sheetData.acceptResult.indexes[0] === 1; // 0: No, 1: Yes
        run.scoreSheet.specialAttention |= sheetData.enterManually.indexes[0] === 1;

        run.started = true;
        run.status = 4;

        var retScoreCals = scoreCalculator.calculateMazeScore(run).split(",");
        run.score = retScoreCals[0];
        run.foundVictims = retScoreCals[1];
        run.distKits = retScoreCals[2];

        run.save((err) => {
          if (err) {
            logger.error(err);
            res.status(400).send({
              msg: "Error saving run in db",
              err: err.message
            })
          }
        });

        fs.unlink(req.file.path, (err) => {
          if (err) throw err;
        });
      }
    });

    res.end('File is uploaded and processed');
  })

});

privateRouter.get('/scoresheetimg/:run/:img', function (req, res, next) {
  function checkAndSend(image) {
    if (!image || !image.contentType) {
      res.status(404).send({
        msg: "image has not been registered yet",
      });
      return;
    }
    res.contentType(image.contentType);
    res.send(image.data);
  }

  var run_id = req.params.run;
  var img_type = req.params.img;

  if (!ObjectId.isValid(run_id)) {
    return next()
  }

  mazeRun.findById(ObjectId(run_id), (err, run) => {
    if (err) {
      logger.error(err);
      res.status(400).send({
        msg: "Could not get run",
        err: err.message
      });
    } else {
      switch (img_type.toString()) {
        case "sheet":
          checkAndSend(run.scoreSheet.fullSheet);
          break;

        case "lop":
          checkAndSend(run.scoreSheet.LoPImage);
          break;

        case "tiles":
          checkAndSend(run.scoreSheet.tileDataImage);
          break;

        case "exitBonus":
          checkAndSend(run.scoreSheet.exitBonusImage);
          break;

        case "misidentification":
          checkAndSend(run.scoreSheet.misidentificationImage);
          break;

        case "time":
          checkAndSend(run.scoreSheet.timeImage);
          break;

        default:
          res.status(400).send({
            msg: "err"
          })
      }
    }
  });
})

adminRouter.get('/apteam/:cid/:teamid/:group', function (req, res, next) {
    const cid = req.params.cid
    const team = req.params.teamid
    const group = req.params.group
    if (!ObjectId.isValid(cid)) {
        return next()
    }
    if (!ObjectId.isValid(team)) {
        return next()
    }

    if (!auth.authCompetition(req.user, cid, ACCESSLEVELS.ADMIN)) {
        return res.status(401).send({
            msg: "You have no authority to access this api!!"
        })
    }



    mazeRun.find({
            'competition': cid,
            'group': group
        })
        .exec(function (err, dbRun) {
            if (err) {
                logger.error(err)
                res.status(400).send({
                    msg: "Could not get run",
                    err: err.message
                })
            } else if (dbRun) {
                var resp = [];
                for (let run of dbRun) {
                    run.team = team;
                    run.group = null;
                    run.save(function (err) {
                        if (err) {
                            logger.error(err)
                            return res.status(400).send({
                                err: err.message,
                                msg: "Could not save run"
                            })
                        } else {
                        }
                    })
                    let col = {
                      time: run.startTime,
                      field: run.field
                    };
                    resp.push(col);
                }
                //res.send(dbRun);
                //logger.debug(dbRun);


                        return res.status(200).send({
                            msg: "Saved change",
                            data: resp
                        })
            }
        })
})

privateRouter.put('/map/:runid', function (req, res, next) {
    const id = req.params.runid
    if (!ObjectId.isValid(id)) {
        return next()
    }

    const run = req.body

    // Exclude fields that are not allowed to be publicly changed
    delete run._id
    delete run.__v
    delete run.competition
    delete run.round
    delete run.team
    delete run.field
    delete run.score
    delete run.tiles
    delete run.LoPs
    delete run.evacuationLevel
    delete run.exitBonus
    delete run.rescuedLiveVictims
    delete run.rescuedDeadVictims
    delete run.showedUp
    delete run.time

    //logger.debug(run)

    mazeRun.findById(id)
        .exec(function (err, dbRun) {
            if (err) {
                logger.error(err)
                res.status(400).send({
                    msg: "Could not get run",
                    err: err.message
                })
            } else {
                if (!auth.authCompetition(req.user, dbRun.competition, ACCESSLEVELS.JUDGE)) {
                    return res.status(401).send({
                        msg: "You have no authority to access this api!!"
                    })
                }

                dbRun.map = run.map

                dbRun.save(function (err) {
                    if (err) {
                        logger.error(err)
                        return res.status(400).send({
                            err: err.message,
                            msg: "Could not save run"
                        })
                    } else {
                        if (socketIo !== undefined) {
                            socketIo.sockets.in('runs/map/' + dbRun._id).emit('mapChange', {
                                newMap: dbRun.map
                            })
                        }
                        return res.status(200).send({
                            msg: "Saved run",
                            map: dbRun.map
                        })
                    }
                })
            }
        })
})


/**
 * @api {delete} /runs/maze/:runids Delete run
 * @apiName DeleteRuns
 * @apiGroup Run
 * @apiVersion 1.1.0
 *
 * @apiParam {String} runids The run ids
 *
 * @apiSuccess (200) {String} msg Success msg
 *
 * @apiError (400) {String} err The error message
 */
adminRouter.delete('/:runids', function (req, res) {
  var ids = req.params.runids.split(",");
  if (!ObjectId.isValid(ids[0])) {
    return next()
  }
  mazeRun.findById(ids[0])
    .select("competition")
    .exec(function (err, dbRun) {
      if (err) {
        logger.error(err)
        res.status(400).send({
          msg: "Could not get run",
          err: err.message
        })
      } else if (dbRun) {
          if(!auth.authCompetition(req.user , dbRun.competition , ACCESSLEVELS.ADMIN)){
              return res.status(401).send({
                                msg: "You have no authority to access this api"
              })
          }
      }
      mazeRun.remove({
        '_id': {$in : ids},
        'competition': dbRun.competition
      }, function (err) {
        if (err) {
          logger.error(err)
          res.status(400).send({
            msg: "Could not remove run",
            err: err.message
          })
        } else {
          res.status(200).send({
            msg: "Run has been removed!"
          })
        }
      })
    })
})


/**
 * @api {post} /runs/maze Create new run
 * @apiName PostRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {String} competition The competition id
 * @apiParam {String} round       The round id
 * @apiParam {String} team        The team id
 * @apiParam {String} field       The field id
 * @apiParam {String} map         The map id
 *
 * @apiSuccess (200) {String} msg Success msg
 * @apiSuccess (200) {String} id  The new run id
 *
 * @apiError (400) {String} err The error message
 */
adminRouter.post('/', function (req, res) {
    const run = req.body

    if (!auth.authCompetition(req.user, run.competition, ACCESSLEVELS.ADMIN)) {
        return res.status(401).send({
            msg: "You have no authority to access this api"
        })
    }
    if (run.team) {
        var regist = {
            competition: run.competition,
            round: run.round,
            team: run.team,
            field: run.field,
            map: run.map,
            startTime: run.startTime
        }
    } else {
        var regist = {
            competition: run.competition,
            round: run.round,
            group: run.group,
            field: run.field,
            map: run.map,
            startTime: run.startTime
        }
    }
    new mazeRun(regist).save(function (err, data) {
        if (err) {
            logger.error(err)
            return res.status(400).send({
                msg: "Error saving run in db",
                err: err.message
            })
        } else {
            res.location("/api/runs/" + data._id)
            return res.status(201).send({
                msg: "New run has been saved",
                id: data._id
            })
        }
    })
})



publicRouter.all('*', function (req, res, next) {
    next()
})
privateRouter.all('*', function (req, res, next) {
    next()
})

module.exports.public = publicRouter
module.exports.private = privateRouter
module.exports.admin = adminRouter
