"use strict"
const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const mazeRun = require('../../models/mazeRun').mazeRun
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const scoreCalculator = require('../../helper/scoreCalculator')
const scoreSheetPDF = require('../../helper/scoreSheetPDFMaze');
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
                    delete dbRuns[i].map
                    delete dbRuns[i].field
                    delete dbRuns[i].comment
                    delete dbRuns[i].sign
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
module.exports.getLatestMazeRun = getLatestMazeRun

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
        .populate("map")
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
                if (!auth.authCompetition(req.user, dbRun.competition, ACCESSLEVELS.JUDGE)) {
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
                
                if(run.status != dbRun.status) statusUpdate = true;
                
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
publicRouter.get('/scoresheet', function (req, res, next) {
  const competition = req.query.competition || req.params.competition

  if (competition == null || competition.constructor !== String) {
    res.status(400).send({
      msg: "Err competition"
    })
  }

  var query = mazeRun.find({
    competition: competition
  })

  query.select("competition round team field map startTime")
  query.populate([
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
      select: "name height width length startTile cells"
    }
  ])

  query.lean().exec(function (err, dbRuns) {
    if (err) {
      logger.error(err)
      res.status(400).send({
        msg: "Could not get runs"
      })
    } else if (dbRuns) {
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
