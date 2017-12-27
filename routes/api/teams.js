//========================================================================
//                          Libraries
//========================================================================

var express = require('express')
var publicRouter = express.Router()
var privateRouter = express.Router()
var adminRouter = express.Router()
var competitiondb = require('../../models/competition')
var query = require('../../helper/query-helper')
var validator = require('validator')
var async = require('async')
var ObjectId = require('mongoose').Types.ObjectId
var logger = require('../../config/logger').mainLogger
var multer = require('multer');
var path = require('path')
const auth = require('../../helper/authLevels')
const fs = require('fs')
const ACCESSLEVELS = require('../../models/user').ACCESSLEVELS

publicRouter.get('/', function (req, res) {
  query.doFindResultSortQuery(req, res, null, null, competitiondb.team)
})

publicRouter.get('/leagues', function (req, res) {
  res.send(competitiondb.team.schema.path('league').enumValues)
})

publicRouter.get('/:teamid', function (req, res, next) {
  var id = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  query.doIdQuery(req, res, id, "", competitiondb.team)
})

privateRouter.put('/:competitionid/:teamid', function (req, res, next) {
  var id = req.params.teamid
  const competitionid = req.params.competitionid
  if (!ObjectId.isValid(id)) {
    return next()
  }
    
  if(!auth.authCompetition(req.user, competitionid, ACCESSLEVELS.JUDGE)){
        res.status(401).send({
                        msg: "You have no authority to access this api"
        })
        return next()
  }
    
    const team = req.body

    competitiondb.team.findOne({_id:id , competition: competitionid})
        .exec(function (err, dbTeam) {
                if (err) {
                    logger.error(err)
                    res.status(400).send({
                        msg: "Could not get user",
                        err: err.message
                    })
                } else if (dbTeam) {
                    if(team.interviewer!=null)dbTeam.interviewer = team.interviewer
                    if(team.comment!=null)dbTeam.comment = team.comment
                    if(team.inspected!=null)dbTeam.inspected = team.inspected

                    dbTeam.save(function (err) {
                        if (err) {
                            logger.error(err)
                            return res.status(400).send({
                                err: err.message,
                                msg: "Could not save changes"
                            })
                        } else {
                            return res.status(200).send({
                                msg: "Saved changes"
                            })
                        }
                    })

                }
            }

        )
  
  
})

publicRouter.get('/:teamid/runs', function (req, res, next) {
  var id = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  
  competitiondb.run.find({team: id}, function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Could not get runs", err: err.message})
    } else {
      res.status(200).send(data)
    }
  })
})

adminRouter.delete('/:teamid', function (req, res, next) {
  var ids = req.params.teamid.split(",");
  if (!ObjectId.isValid(ids[0])) {
    return next()
  }
  competitiondb.team.findById(ids[0])
    .select("competition")
    .exec(function (err, dbTeam) {
      if (err) {
        logger.error(err)
        res.status(400).send({
          msg: "Could not get team",
          err: err.message
        })
      } else if (dbTeam) {
          if(!auth.authCompetition(req.user , dbTeam.competition , ACCESSLEVELS.ADMIN)){
              return res.status(401).send({
                                msg: "You have no authority to access this api"
              })
          }
      }
      competitiondb.team.remove({
        '_id': {$in : ids},
        'competition': dbTeam.competition
      }, function (err) {
        if (err) {
          logger.error(err)
          res.status(400).send({msg: "Could not remove team", err: err.message})
        } else {
          res.status(200).send({msg: "Team has been removed!"})
        }
      })
  })
})

adminRouter.post('/', function (req, res) {
  var team = req.body
  
  var newTeam = new competitiondb.team({
    name       : team.name,
    league     : team.league,
    competition: team.competition
  })
  
  newTeam.save(function (err, data) {
    if (err) {
      logger.error(err)
      res.status(400).send({msg: "Error saving team", err: err.message})
    } else {
      res.location("/api/teams/" + data._id)
      res.status(201).send({msg: "New team has been saved", id: data._id})
    }
  })
})

function isExistFile(file) {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}

privateRouter.get('/document/:competitionid/:teamid', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)){
      competitiondb.competition.findOne({_id:id})
        .exec(function (err, dbCompe) {
                if (err) {
                    logger.error(err)
                    res.status(400).send({
                        msg: "Could not get competition",
                        err: err.message
                    })
                } else if (dbCompe) {
                    competitiondb.team.findOne({_id:tid , competition: id})
                    .exec(function (err, dbTeam) {
                            if (err) {
                                logger.error(err)
                                res.status(400).send({
                                    msg: "Could not get team",
                                    err: err.message
                                })
                            } else if (dbTeam) {
                                var path = __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name + "/content.json"
                                if(isExistFile(path)){
                                    const data = require(path)
                                    delete require.cache[require.resolve(path)];
                                    res.json(data)
                                }else{
                                    res.status(404).send({
                                        msg: "No json file for this team"
                                    })
                                }
                                
                            }
                        }

                    )


                }
            }

        )
  }
  else{
      res.status(401).send({
                        msg: "You have no authority to access this api"
        })
      return next()
  }
})


privateRouter.get('/pdf/:competitionid/:teamid', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)){
      competitiondb.competition.findOne({_id:id})
        .exec(function (err, dbCompe) {
                if (err) {
                    logger.error(err)
                    res.status(400).send({
                        msg: "Could not get competition",
                        err: err.message
                    })
                } else if (dbCompe) {
                    competitiondb.team.findOne({_id:tid , competition: id})
                    .exec(function (err, dbTeam) {
                            if (err) {
                                logger.error(err)
                                res.status(400).send({
                                    msg: "Could not get team",
                                    err: err.message
                                })
                            } else if (dbTeam) {
                                var path = __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name + "/doc.pdf"
                                if(isExistFile(path)){
                                    var file = fs.createReadStream(path);
                                    var stat = fs.statSync(path);
                                    res.setHeader('Content-Length', stat.size);
                                    res.setHeader('Content-Type', 'application/pdf');
                                    res.setHeader('Content-Disposition', 'attachment; filename=doc.pdf');
                                    file.pipe(res);
                                }else{
                                    res.status(404).send({
                                        msg: "No PDF file for this team"
                                    })
                                }
                                
                            }
                        }

                    )


                }
            }

        )
  }
  else{
      res.status(401).send({
                        msg: "You have no authority to access this api"
        })
      return next()
  }
})

privateRouter.get('/pic/:competitionid/:teamid/:pic', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.teamid
  const pic = req.params.pic
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if (!ObjectId.isValid(tid)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)){
      competitiondb.competition.findOne({_id:id})
        .exec(function (err, dbCompe) {
                if (err) {
                    logger.error(err)
                    res.status(400).send({
                        msg: "Could not get competition",
                        err: err.message
                    })
                } else if (dbCompe) {
                    competitiondb.team.findOne({_id:tid , competition: id})
                    .exec(function (err, dbTeam) {
                            if (err) {
                                logger.error(err)
                                res.status(400).send({
                                    msg: "Could not get team",
                                    err: err.message
                                })
                            } else if (dbTeam) {
                                var path = __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name + "/" + "pic" + pic + ".jpg";
                                if(isExistFile(path)){
                                    fs.readFile(path,function(err,data){
                                        res.writeHead(200, {'Content-Type': 'image/jpeg' });
                                        res.end(data);
                                    });
                                    return;
                                }
                                
                                var path = __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name + "/" + "pic" + pic + ".jpeg";
                                if(isExistFile(path)){
                                    fs.readFile(path,function(err,data){
                                        res.writeHead(200, {'Content-Type': 'image/jpeg' });
                                        res.end(data);
                                    });
                                    return;
                                }
                                
                                var path = __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name + "/" + "pic" + pic + ".png";
                                if(isExistFile(path)){
                                    fs.readFile(path,function(err,data){
                                        res.writeHead(200, {'Content-Type': 'image/png' });
                                        res.end(data);
                                    });
                                    return;
                                }
                                

                                res.status(404).send({
                                    msg: "No Pic file for this team"
                                })
                            }
                        }

                    )


                }
            }

        )
  }
  else{
      res.status(401).send({
                        msg: "You have no authority to access this api"
        })
      return next()
  }
})

privateRouter.get('/pic/:competitionid/:teamid', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.teamid
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if (!ObjectId.isValid(tid)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)){
      competitiondb.competition.findOne({_id:id})
        .exec(function (err, dbCompe) {
                if (err) {
                    logger.error(err)
                    res.status(400).send({
                        msg: "Could not get user",
                        err: err.message
                    })
                } else if (dbCompe) {
                    competitiondb.team.findOne({_id:tid , competition: id})
                    .exec(function (err, dbTeam) {
                            if (err) {
                                logger.error(err)
                                res.status(400).send({
                                    msg: "Could not get user",
                                    err: err.message
                                })
                            } else if (dbTeam) {
                                var pic = 0;
                                while(1){
                                    var path1 = __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name + "/" + "pic" + pic + ".jpg";
                                    var path2 = __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name + "/" + "pic" + pic + ".jpeg";
                                    var path3 = __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name + "/" + "pic" + pic + ".png";
                                    if(!isExistFile(path1)&&!isExistFile(path2)&&!isExistFile(path3))break;
                                    pic++;
                                }
                                
                                res.status(200).send({
                                    number: pic
                                })
                            }
                        }

                    )


                }
            }

        )
  }
  else{
      res.status(401).send({
                        msg: "You have no authority to access this api"
        })
      return next()
  }
})

privateRouter.post('/pic/:competitionid/:teamid/:pic', function (req, res, next) {
  const id = req.params.competitionid
  const tid = req.params.teamid
  const pic = req.params.pic
  
  if (!ObjectId.isValid(id)) {
    return next()
  }
  if (!ObjectId.isValid(tid)) {
    return next()
  }
  if(auth.authCompetition(req.user,id,ACCESSLEVELS.JUDGE)){
      competitiondb.competition.findOne({_id:id})
        .exec(function (err, dbCompe) {
                if (err) {
                    logger.error(err)
                    res.status(400).send({
                        msg: "Could not get competition",
                        err: err.message
                    })
                } else if (dbCompe) {
                    competitiondb.team.findOne({_id:tid , competition: id})
                    .exec(function (err, dbTeam) {
                            if (err) {
                                logger.error(err)
                                res.status(400).send({
                                    msg: "Could not get team",
                                    err: err.message
                                })
                            } else if (dbTeam) {
                                var storage = multer.diskStorage({
                                    destination: function(req, file, callback) {
                                        callback(null, __dirname + "/../../TechnicalDocument/" + dbCompe.name + "/" + dbTeam.name)
                                    },
                                    filename: function(req, file, callback) {
                                        callback(null, "pic" + pic + path.extname(file.originalname))
                                    }
                                })
                                
                                var upload = multer({
                                    storage: storage
                                }).single('file')
                                
                                upload(req, res, function(err) {
                                    res.end('File is uploaded')
                                })
                            }
                        }

                    )


                }
            }

        )
  }
  else{
      res.status(401).send({
                        msg: "You have no authority to access this api"
        })
      return next()
  }
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