//========================================================================
//                          Libraries
//========================================================================

const express = require('express')
const publicRouter = express.Router()
const privateRouter = express.Router()
const adminRouter = express.Router()
const competitiondb = require('../../models/competition')
const lineMapDb = require('../../models/lineMap')
const lineRunDb = require('../../models/lineRun')
const mazeMapDb = require('../../models/mazeMap')
const mazeRunDb = require('../../models/mazeRun')

const userdb = require('../../models/user')
const lineMapsApi = require('./lineMaps')
const lineRunsApi = require('./lineRuns')
const mazeMapsApi = require('./mazeMaps')
const mazeRunsApi = require('./mazeRuns')
const query = require('../../helper/query-helper')
const validator = require('validator')
const async = require('async')
const ObjectId = require('mongoose').Types.ObjectId
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const auth = require('../../helper/authLevels')


const LINE_LEAGUES = competitiondb.LINE_LEAGUES
const MAZE_LEAGUES = competitiondb.MAZE_LEAGUES
const LEAGUES = competitiondb.LEAGUES
const LEAGUES_JSON = competitiondb.LEAGUES_JSON;

const ACCESSLEVELS = require('../../models/user').ACCESSLEVELS


publicRouter.get('/', function (req, res) {
    competitiondb.competition.find({}).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get competitions",
                err: err.message
            })
        } else {
            for(let i=0;i<data.length;i++){
                if(req.user) data[i].authLevel = auth.competitionLevel(req.user,data[i]._id);
                else data[i].authLevel = 0;
                if(!data[i].color) data[i].color = "000000";
                if(!data[i].bkColor) data[i].bkColor = "ffffff";
                if(!data[i].message) data[i].message = "";
                if(!data[i].description) data[i].description = "";
                if(!data[i].logo) data[i].logo = "/images/NoImage.png";
            }
            res.status(200).send(data)
        }
    })
})

publicRouter.get('/rules', function (req, res) {
    res.send(competitiondb.competition.schema.path('rule').enumValues)
})

publicRouter.get('/leagues/:league', async function (req, res, next) {
    var league = req.params.league;

    if (LEAGUES.filter(function (elm){
        return elm.indexOf(league) != -1;
    }).length == 0){
        return next()
    }

    for(let j in LEAGUES_JSON){
        if(LEAGUES_JSON[j].id == league){
            let ret = {
                id: LEAGUES_JSON[j].id,
                type: LEAGUES_JSON[j].type,
                name: LEAGUES_JSON[j].name
            };
            res.send(ret);
            break;
        }
    }
})

publicRouter.get('/:competition', function (req, res, next) {
    const id = req.params.competition;

    if (!ObjectId.isValid(id)) {
        return next()
    }

    competitiondb.competition.findById(id).lean().exec(function (err, data) {
        if (err) {
            logger.error(err);
            res.status(400).send({
                msg: "Could not get competition",
                err: err.message
            })
        } else {
            if(!data.color) data.color = "000000";
            if(!data.bkColor) data.bkColor = "ffffff";
            if(!data.message) data.message = "";
            if(!data.description) data.description = "";
            if(!data.logo) data.logo = "/images/NoImage.png";
            res.status(200).send(data)
        }
    })
})

adminRouter.put('/:competitionid', function (req, res, next) {
    var id = req.params.competitionid;
    let data = req.body;

    if (!ObjectId.isValid(id)) {
        return next()
    }
    if (!auth.authCompetition(req.user, id, ACCESSLEVELS.ADMIN)) {
        return res.status(401).send({
            msg: "You have no authority to access this api"
        })
    }

    competitiondb.competition.findById(id)
      .exec(function (err, dbCompetition) {
            if (err) {
                logger.error(err)
                res.status(400).send({
                    msg: "Could not get competition",
                    err: err.message
                })
            } else if (dbCompetition) {
                dbCompetition.name = data.name;
                dbCompetition.rule = data.rule;
                dbCompetition.logo = data.logo;
                dbCompetition.bkColor = data.bkColor;
                dbCompetition.color = data.color;
                dbCompetition.message = data.message;
                dbCompetition.description = data.description;

                dbCompetition.ranking = [];
                for(let i in data.ranking){
                    let tmp = {
                        'league': data.ranking[i].id,
                        'num': data.ranking[i].count
                    }
                    dbCompetition.ranking.push(tmp);
                }

                dbCompetition.save(function (err) {
                    if (err) {
                        logger.error(err)
                        return res.status(400).send({
                            err: err.message,
                            msg: "Could not save changes"
                        })
                    } else {
                        res.status(200).send({
                            msg: "Settings has been saved"
                        })
                    }
                })

            }
        }

      );
})

publicRouter.get('/:competition/teams', function (req, res, next) {
    const id = req.params.competition;

    if (!ObjectId.isValid(id)) {
        return next()
    }

    competitiondb.team.find({
        competition: id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get teams",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})

publicRouter.get('/:competition/teams/:teamid', function (req, res, next) {
    const id = req.params.competition
    const tid = req.params.teamid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    if (!ObjectId.isValid(tid)) {
        return next()
    }

    competitiondb.team.findOne({
        competition: id,
        _id: tid
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get teams",
                err: err.message
            })
        } else {
            if(!auth.authCompetition(req.user,id,ACCESSLEVELS.VIEW)){
                delete data.interviewer
                if(!data.docPublic) delete data.comment
            }
            res.status(200).send(data)
        }
    })
})

publicRouter.get('/:competition/:league/teams', function (req, res, next) {
    const id = req.params.competition
    const league = req.params.league

    if (!ObjectId.isValid(id)) {
        return next()
    }

    if (LEAGUES.filter(function (elm){
      return elm.indexOf(league) != -1;
    }).length == 0){
      return next()
    }

    competitiondb.team.find({
        competition: id,
        league: new RegExp(".*" + league + ".*" , "i")
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get teams",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})

publicRouter.get('/:competitionid/teams/:name', function (req, res, next) {
    var id = req.params.competitionid
    var name = req.params.name

    if (!ObjectId.isValid(id)) {
        return next()
    }

    competitiondb.team.find({
        "competition": id,
        "name": name
    }, function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get teams"
            })
        } else {
            res.status(200).send(data)
        }
    }).select("_id")
})

publicRouter.get('/:competition/line/runs', function (req, res, next) {
    var id = req.params.competition

    if (!ObjectId.isValid(id)) {
        return next()
    }
    return lineRunsApi.getLineRuns(req, res, next)
})

publicRouter.get('/:competition/line/latestrun', function (req, res, next) {
    var id = req.params.competition

    if (!ObjectId.isValid(id)) {
        return next()
    }
    return lineRunsApi.getLatestLineRun(req, res, next)
})

publicRouter.get('/:competition/maze/runs', function (req, res, next) {
    var id = req.params.competition

    if (!ObjectId.isValid(id)) {
        return next()
    }
    return mazeRunsApi.getMazeRuns(req, res, next)
})

publicRouter.get('/:competition/maze/latestrun', function (req, res, next) {
    var id = req.params.competition

    if (!ObjectId.isValid(id)) {
        return next()
    }
    return mazeRunsApi.getLatestMazeRun(req, res, next)
})

privateRouter.get('/:competition/:league/maps', function (req, res, next) {
    const id = req.params.competition
    const league = req.params.league

    if (!ObjectId.isValid(id)) {
        return next()
    }


    if (LINE_LEAGUES.filter(function (elm){
      return elm.indexOf(league) != -1;
    }).length != 0){
      return lineMapsApi.getLineMaps(req, res, next)
    }

    if (MAZE_LEAGUES.filter(function (elm){
      return elm.indexOf(league) != -1;
    }).length != 0){
      return mazeMapsApi.getMazeMaps(req, res, next)
    }

    return next()
});


privateRouter.get('/:competition/line/maps', function (req, res, next) {
    const id = req.params.competition

    if (!ObjectId.isValid(id)) {
        return next()
    }

    return lineMapsApi.getLineMaps(req, res, next)
})

privateRouter.get('/:competition/maze/maps', function (req, res, next) {
    const id = req.params.competition

    if (!ObjectId.isValid(id)) {
        return next()
    }

    return mazeMapsApi.getMazeMaps(req, res, next)
})

publicRouter.get('/:competition/fields', function (req, res, next) {
    var id = req.params.competition

    if (!ObjectId.isValid(id)) {
        return next()
    }

    competitiondb.field.find({
        competition: id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get fields",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})

publicRouter.get('/:competitionid/runs/:field/:status', function (req, res, next) {
    var id = req.params.competitionid
    var field_id = req.params.field
    var status = req.params.status
    if (!ObjectId.isValid(id)) {
        return next()
    }
    if (!ObjectId.isValid(field_id)) {
        return next()
    }
    populate = ["team"]
    var query = competitiondb.run.find({
        competition: id,
        field: field_id,
        status: status
    }, "field team competition status")
    query.populate(populate)
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

publicRouter.get('/:competition/:league/fields', function (req, res, next) {
    const id = req.params.competition
    const league = req.params.league

    if (!ObjectId.isValid(id)) {
        return next()
    }

    if (LEAGUES.filter(function (elm){
      return elm.indexOf(league) != -1;
    }).length == 0){
      return next()
    }

    competitiondb.field.find({
        competition: id,
        league: new RegExp(".*" + league + ".*" , "i")
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get fields",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})

publicRouter.get('/:competitionid/fields/:name', function (req, res, next) {
    var id = req.params.competitionid
    var name = req.params.name

    if (!ObjectId.isValid(id)) {
        return next()
    }

    competitiondb.field.find({
        competition: id,
        name: name
    }, function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get fields"
            })
        } else {
            res.status(200).send(data)
        }
    }).select("_id")
})

publicRouter.get('/:competition/rounds', function (req, res, next) {
    var id = req.params.competition

    if (!ObjectId.isValid(id)) {
        return next()
    }

    competitiondb.round.find({
        competition: id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get rounds",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})

publicRouter.get('/:competitionid/rounds/:name', function (req, res, next) {
    var id = req.params.competitionid
    var name = req.params.name

    if (!ObjectId.isValid(id)) {
        return next()
    }

    competitiondb.round.find({
        competition: id,
        name: name
    }, function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get rounds"
            })
        } else {
            res.status(200).send(data)
        }
    }).select("_id")
})

publicRouter.get('/:competition/:league/rounds', function (req, res, next) {
    var id = req.params.competition
    const league = req.params.league

    if (!ObjectId.isValid(id)) {
        return next()
    }

    if (LEAGUES.filter(function (elm){
      return elm.indexOf(league) != -1;
    }).length == 0){
      return next()
    }

    competitiondb.round.find({
        competition: id,
        league: new RegExp(".*" + league + ".*" , "i")
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get rounds",
                err: err.message
            })
        } else {
            res.status(200).send(data)
        }
    })
})

adminRouter.post('/', function (req, res) {

    const competition = req.body

    new competitiondb.competition({
        name: competition.name,
        rule: competition.rule
    }).save(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(
              400).send({
                msg: "Error saving competition",
                err: err.message
            })
        } else {
            const userid = req.user._id
            const competitionid = data._id
            const aLevel = ACCESSLEVELS.ADMIN

            userdb.user.findById(userid)
                .exec(function (err, dbUser) {
                        if (err) {
                            logger.error(err)
                            res.status(400).send({
                                msg: "Could not get user",
                                err: err.message
                            })
                        } else if (dbUser) {

                            var newData = {
                                id: competitionid,
                                accessLevel: aLevel
                            }
                            dbUser.competitions.push(newData)

                            dbUser.save(function (err) {
                                if (err) {
                                    logger.error(err)
                                    return res.status(400).send({
                                        err: err.message,
                                        msg: "Could not save changes"
                                    })
                                } else {
                                    res.status(201).send({
                                        msg: "New competition has been saved",
                                        id: data._id
                                    })
                                }
                            })

                        }
                    }

                )
        }
    })
})

adminRouter.delete('/:competitionid', function (req, res, next) {
    var id = req.params.competitionid

    if (!ObjectId.isValid(id)) {
        return next()
    }
    if (!auth.authCompetition(req.user, id, ACCESSLEVELS.ADMIN)) {
        return res.status(401).send({
            msg: "You have no authority to access this api"
        })
    }

    competitiondb.competition.deleteMany({
        _id: id
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

    competitiondb.round.deleteMany({
        competition: id
    }, function (err) {
        if (err) {
            logger.error(err)
        }
    })

    competitiondb.field.deleteMany({
        competition: id
    }, function (err) {
        if (err) {
            logger.error(err)
        }
    })

    competitiondb.team.deleteMany({
        competition: id
    }, function (err) {
        if (err) {
            logger.error(err)
        }
    })

    lineRunDb.lineRun.deleteMany({
        competition: id
    }, function (err) {
        if (err) {
            logger.error(err)
        }
    })

    lineMapDb.lineMap.deleteMany({
        competition: id
    }, function (err) {
        if (err) {
            logger.error(err)
        }
    })

    mazeRunDb.mazeRun.deleteMany({
        competition: id
    }, function (err) {
        if (err) {
            logger.error(err)
        }
    })

    mazeMapDb.mazeMap.deleteMany({
        competition: id
    }, function (err) {
        if (err) {
            logger.error(err)
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
