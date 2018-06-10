"use strict"
const express = require('express')
const multer = require('multer')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const lineRun = require('../../models/lineRun').lineRun
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const pathFinder = require('../../helper/pathFinder')
const scoreCalculator = require('../../helper/scoreCalculator')
const auth = require('../../helper/authLevels')
const scoreSheetLinePDF = require('../../helper/scoreSheetPDFLine')
const scoreSheetLineProcess = require('../../helper/scoreSheetProcessLine')
const scoreSheetProcess = require('../../helper/scoreSheetProcessUtil')
const ACCESSLEVELS = require('../../models/user').ACCESSLEVELS

var socketIo

module.exports.connectSocketIo = function (io) {
  socketIo = io
}

/**
 * @api {get} /runs/line Get runs
 * @apiName GetRun
 * @apiGroup Run
 * @apiVersion 1.0.1
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
 * @apiSuccess (200) {Number}   -.status
 * @apiSuccess (200) {Number}   -.rescuedLiveVictims
 * @apiSuccess (200) {Number}   -.rescuedDeadVictims
 * @apiSuccess (200) {Object[]} -             Array of LoPs
 *
 * @apiError (400) {String} msg The error message
 */
publicRouter.get('/', getLineRuns)

function getLineRuns(req, res) {
  const competition = req.query.competition || req.params.competition
  
  var query
  if (competition != null && competition.constructor === String) {
    if (req.query['ended'] == 'false') {
      query = lineRun.find({
        competition: competition,
        status     : {$lte: 1}
      })
    } else {
      query = lineRun.find({
        competition: competition
      })
    }
    
  } else if (Array.isArray(competition)) {
    query = lineRun.find({
      competition: {
        $in: competition.filter(ObjectId.isValid)
      }
    })
  } else {
    query = lineRun.find({})
  }
  
  if (req.query['minimum']) {
    query.select("competition round team field status started startTime sign")
  } else {
    query.select("competition round team field map score time status started LoPs comment startTime sign rescueOrder")
  }
  
  
  if (req.query['populate'] !== undefined && req.query['populate']) {
    query.populate([
      {
        path  : "competition",
        select: "name"
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
        select: "name"
      }
    ])
  }
  
  query.lean().exec(function (err, dbRuns) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get runs"
      })
    } else if (dbRuns) {
      
      // Hide map and field from public
      for (let i = 0; i < dbRuns.length; i++) {
        if (!auth.authViewRun(req.user, dbRuns[i], ACCESSLEVELS.NONE + 1)) {
          delete dbRuns[i].map
          delete dbRuns[i].field
          delete dbRuns[i].comment
          delete dbRuns[i].sign
        }
      }
      res.status(200).send(dbRuns)
    }
  })
}
module.exports.getLineRuns = getLineRuns

publicRouter.get('/latest', getLatestLineRun)

function getLatestLineRun(req, res) {
  const competition = req.query.competition || req.params.competition
  const field = req.query.field || req.params.field
  const fields = req.query.fields
  
  var selection = {
    competition: competition,
    field      : field
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
  
  var query = lineRun.findOne(selection).sort("-updatedAt")
  
  if (req.query['populate'] !== undefined && req.query['populate']) {
    query.populate(["round", "team", "field", "competition", {
      path    : 'tiles',
      populate: {
        path: 'tileType'
      }
    }])
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
      res.status(200).send(dbRun)
    }
  })
}
module.exports.getLatestLineRun = getLatestLineRun

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
  var query = lineRun.find({
    competition: id,
    field      : field_id,
    status     : status
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
 * @api {get} /runs/line/:runid Get run
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
  
  const query = lineRun.findById(id, "-__v")
  
  if (req.query['populate'] !== undefined && req.query['populate']) {
    query.populate(["round", "team", "field", "competition", {
      path    : 'tiles',
      populate: {
        path: 'tileType'
      }
    }])
  }
  
  query.lean().exec(function (err, dbRun) {
    if (err) {
      logger.error(err)
      return res.status(400).send({
        err: err.message,
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
})

/**
 * @api {put} /runs/line/:runid Update run
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
  
  lineRun.findById(id)
  //.select("-_id -__v -competition -round -team -field -score")
    .populate({
      path    : 'map',
      populate: {
        path: 'tiles.tileType'
      }
    })
    .exec(function (err, dbRun) {
      if (err) {
        logger.error(err)
        res.status(400).send({
          msg: "Could not get run",
          err: err.message
        })
      } else if (dbRun) {
        if (run.tiles != null && run.tiles.constructor === Object) { // Handle dict as "sparse" array
          const tiles = run.tiles
          run.tiles = []
          Object.keys(tiles).forEach(function (key) {
            if (!isNaN(key)) {
              run.tiles[key] = tiles[key]
            }
          })
        }
        
        if (run.LoPs != null && run.LoPs.length != dbRun.LoPs.length) {
          dbRun.LoPs.length = run.LoPs.length
        }
          
        if(run.rescueOrder != null){
            dbRun.rescueOrder = run.rescueOrder;
        }
        
        // Recursively updates properties in "dbObj" from "obj"
        const copyProperties = function (obj, dbObj) {
          for (let prop in obj) {
            if (obj.constructor == Array ||
                (obj.hasOwnProperty(prop) &&
                 (dbObj.hasOwnProperty(prop) ||
                  (dbObj.get !== undefined &&
                   dbObj.get(prop) !== undefined)))) { // Mongoose objects don't have hasOwnProperty
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
        
        err = copyProperties(run, dbRun)
        
        if (err) {
          logger.error(err)
          return res.status(400).send({
            err: err.message,
            msg: "Could not save run"
          })
        }
        
        dbRun.score = scoreCalculator.calculateLineScore(dbRun)
        
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
              socketIo.sockets.in('runs/line').emit('changed')
              socketIo.sockets.in('competition/' +
                                  dbRun.competition).emit('changed')
              socketIo.sockets.in('runs/' + dbRun._id).emit('data', dbRun)
              socketIo.sockets.in('fields/' +
                                  dbRun.field).emit('data', {
                newRun: dbRun._id
              })
            }
            return res.status(200).send({
              msg  : "Saved run",
              score: dbRun.score
            })
          }
        })
      }
    })
})

/**
 * @api {get} /scoreSheet Generate scoring sheet for list of runs
 * @apiName GetScoringSheet
 * @apiGroup Get
 * @apiVersion 1.0.1
 *
 * @apiParam {Object} run Run to generate sheet for
 * @apiParam {Object} competition
 * @apiParam {Object} field
 * @apiParam {Object} startTime (integer) start of the runs to search
 * @apiParam {Object} endTime (integer) end of the runs to search
 *
 * @apiSuccess (200) {String}   "Ok"
 *
 * @apiError (400) {String} msg The error message
 */
publicRouter.get('/scoresheet', function (req, res, next) {
  function isInt(value) {
    let x = parseFloat(value);
    return !isNaN(value) && (x | 0) === x;
  }

  const run = req.query.run || req.params.run;
  const competition = req.query.competition || req.params.competition;
  const field = req.query.field || req.params.field;
  const round = req.query.round || req.params.round;
  const startTime = req.query.startTime || req.params.startTime;
  const endTime = req.query.endTime || req.params.endTime;

  if (competition === null && run === null && round === null) {
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

  if (isInt(startTime) && isInt(endTime)) {
    queryObj.startTime = {$gte: startTime, $lte: endTime}
  } else {
    if (isInt(startTime)) {
      queryObj.startTime = {$gte: startTime}
    } else if (isInt(endTime)) {
      queryObj.startTime = {$lte: endTime}
    }
  }

  var query = lineRun.find(queryObj).sort(sortObj);

  query.select("competition round team field map startTime")
  query.populate([
    {
      path  : "competition",
      select: "name"
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
      select: "name height width length numberOfDropTiles finished startTile tiles indexCount victims",
      populate: {
        path: "tiles.tileType"
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
      let posData = scoreSheetLinePDF.generateScoreSheet(res, dbRuns);
      for (let i = 0; i < dbRuns.length; i++) {
        lineRun.findById(dbRuns[i]._id, (err, run) => {
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

  lineRun.findById(ObjectId(run_id), (err, run) => {
    if (err) {
      logger.error(err);
      res.status(400).send({
        msg: "Could not get run",
        err: err.message
      });
    } else {
      const img_type_split = img_type.toString().split("_");
      switch (img_type_split[0]) {
        case "sheet":
          checkAndSend(run.scoreSheet.fullSheet);
          break;

        case "lop":
          if (img_type_split.length < 2) {
            res.status(400).send({
              msg: "No lop number specified!",
            });
            return;
          }
          let number = parseInt(img_type_split[1], 10);
          if (isNaN(number) || number >= run.scoreSheet.LoPImages.length) {
            res.status(400).send({
              msg: "Invalid number",
            });
            return;
          }
          checkAndSend(run.scoreSheet.LoPImages[number]);
          break;

        case "tiles":
          checkAndSend(run.scoreSheet.tileDataImage);
          break;

        case "evacuationLevel":
          checkAndSend(run.scoreSheet.evacuationLevelImage);
          break;

        case "evacuationBonus":
          checkAndSend(run.scoreSheet.evacuationBonusImage);
          break;

        case "victims":
          checkAndSend(run.scoreSheet.rescuedVictimsImage);
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

/**
 * @api {delete} /runs/line/:runid Delete run
 * @apiName DeleteRun
 * @apiGroup Run
 * @apiVersion 1.0.0
 *
 * @apiParam {String} runid The run id
 *
 * @apiSuccess (200) {String} msg Success msg
 *
 * @apiError (400) {String} err The error message
 */
/**
 * @api {delete} /runs/line/:runids Delete run
 * @apiName DeleteRun
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
    lineRun.findById(ids[0])
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
            lineRun.remove({
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
 * @api {post} /runs/line Create new run
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
  
  new lineRun({
    competition: run.competition,
    round      : run.round,
    team       : run.team,
    field      : run.field,
    map        : run.map,
    startTime  : run.startTime
  }).save(function (err, data) {
    if (err) {
      logger.error(err)
      return res.status(400).send({
        msg: "Error saving run in db",
        err: err.message
      })
    } else {
      res.location("/api/runs/" + data._id)
      return res.status(201).send({
        err: "New run has been saved",
        id : data._id
      })
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
        err: err.message
      })
    }
    let sheetRunID = scoreSheetProcess.processPosdataQRFull(req.file.path);
    if (sheetRunID == null) {
      return res.status(400).send({
        msg: "Error processing file"
      })
    }

    lineRun.findById(ObjectId(sheetRunID)).populate({
      path    : 'map',
      populate: {
        path: 'tiles.tileType'
      }
    }).exec(function(err, run) {
      if (err) {
        logger.error(err)
        res.status(400).send({
          msg: "Could not get run",
          err: err.message
        })
      } else {
        const sheetData = scoreSheetLineProcess.processScoreSheet(run.scoreSheet.positionData, req.file.path);

        run.scoreSheet.fullSheet = sheetData.rawSheet;

        run.tiles = [];
        while (run.tiles.length < run.map.indexCount) {
            run.tiles.push({
                scoredItems:[],
                isDropTile: false
            });
        }
        run.evacuationLevel = sheetData.evacuation.indexes[0] + 1;
        run.scoreSheet.evacuationLevelImage = sheetData.evacuation.img;

        run.time.minutes = sheetData.time.indexes[0];
        run.time.seconds = sheetData.time.indexes[1] * 10 + sheetData.time.indexes[2];
        run.scoreSheet.timeImage = sheetData.time.img;

        // First step: extract the indexes in run.tiles which are marked as checkpoints in sheetData.tiles.tilesData,
        // store the run tiles.isDropTile and scoredItem checkpoint for the corresponding tiles
        let checkpointRunTileIndexes = []; // Start: first CP
        for (let i = 0; i < sheetData.tiles.tilesData.length; i++) {
          if (sheetData.tiles.tilesData[i].length === 1 && sheetData.tiles.tilesData[i][0].meta.id === "checkpoint" && sheetData.tiles.tilesData[i][0].checked) {
            for (let j = 0; j < run.map.tiles[i].index.length; j++) {
              let runTileIndex = run.map.tiles[i].index[j];
              if(runTileIndex < run.map.indexCount - 2) {
                  checkpointRunTileIndexes.push(runTileIndex);
                  run.tiles[runTileIndex].isDropTile = true;
                  run.tiles[runTileIndex].scoredItems.push({item: "checkpoint", scored: false});
              }
            }
          }
        }
        checkpointRunTileIndexes.sort(function(a, b){return a - b});

        // Now copy all the scoring elements and the information if they were scored to
        // run.tiles, except for checkpoints, since the checked means that the checkpoint
        // marker was placed here, but not that it was scored
        for (let i = 0; i < sheetData.tiles.tilesData.length; i++) {
          for (let j = 0; j < sheetData.tiles.tilesData[i].length; j++) {
            let tileData = sheetData.tiles.tilesData[i][j];
            if (tileData.meta.id === "checkpoint") {
              // Ignore checkpoints for now
              continue;
            }
            run.tiles[tileData.meta.tileIndex].scoredItems.push({item: tileData.meta.id, scored: tileData.checked});
          }
        }

        run.LoPs = [];
        let notReached = false; // As soon as one of the checkpoints is marked as not reached all following checkpoints are considered not reached
        // Now check transfer the information if checkpoint was scored from LOP Input field
        for (let i = 0; i < checkpointRunTileIndexes.length + 1 && i < sheetData.checkpoints.length ; i++) {
          if (sheetData.checkpoints[i].indexes[0] === 0 || notReached) {
            // 0 means "N" = not reached was crossed

            run.LoPs.push(0);
            notReached = true;
            // is initially set to not scored
          } else {
            if(checkpointRunTileIndexes[i]){
              run.LoPs.push(sheetData.checkpoints[i].indexes[0] - 1);
              for (let j = 0; j < run.tiles[checkpointRunTileIndexes[i]].scoredItems.length; j++) {
                if (run.tiles[checkpointRunTileIndexes[i]].scoredItems[j].item === "checkpoint") {
                  run.tiles[checkpointRunTileIndexes[i]].scoredItems[j].scored = true;
                }
              }
            }else{
              run.LoPs.push(sheetData.checkpoints[i].indexes[0] - 1);
            }

          }
        }

        run.scoreSheet.LoPImages = [];
        for(let i = 0; i < sheetData.checkpoints.length; i++){
          run.scoreSheet.LoPImages.push(sheetData.checkpoints[i].img);
        }

        run.rescueOrder = [];
        run.exitBonus = 0;
        if (!notReached) {
          // If the robot didn't reach a certain checkpoint don't look at victims and exit bonus
          let rescuedLiveVictims = 0;
          for (let i = 0; i < sheetData.victimOrder.indexes.length; i++) {
            let victimType = "D";
            if (sheetData.victimOrder.indexes[i] === 1) {
              victimType = "L";
              rescuedLiveVictims ++;
            }
            run.rescueOrder.push({type: victimType, effective: victimType === "L" || rescuedLiveVictims === run.map.victims.live});
          }
          run.exitBonus = sheetData.exitBonus.indexes[0] === 0;
        }
        run.scoreSheet.evacuationBonusImage = sheetData.exitBonus.img;
        run.scoreSheet.rescuedVictimsImage = sheetData.victimOrder.img;

        run.scoreSheet.tileDataImage = sheetData.tiles.img;
        run.showedUp = run.tiles[0].scoredItems[0].scored;
        run.score = scoreCalculator.calculateLineScore(run);
        run.started = true;
        run.status = 4;

        run.save((err) => {
          if (err) {
            logger.error(err);
            res.status(400).send({
              msg: "Error saving positiondata of run in db",
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

 // scoreSheetLineProcess.processScoreSheet(posDatas[0], 'helper/scoresheet_n.png')
});

publicRouter.all('*', function (req, res, next) {
  next()
})
privateRouter.all('*', function (req, res, next) {
  next()
})

module.exports.public = publicRouter
module.exports.private = privateRouter
module.exports.admin = adminRouter
