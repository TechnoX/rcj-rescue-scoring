//========================================================================
//                          Libraries
//========================================================================

const express = require('express')
const adminRouter = express.Router()
const competitiondb = require('../../models/competition')
const lineMapDb = require('../../models/lineMap')
const lineRunDb = require('../../models/lineRun')
const mazeMapDb = require('../../models/mazeMap')
const mazeRunDb = require('../../models/mazeRun')

const query = require('../../helper/query-helper')
const validator = require('validator')
const async = require('async')
const multer = require('multer')
const logger = require('../../config/logger').mainLogger
const fs = require('fs')
const FS = require('fs-extra')
const archiver = require('archiver')
const extract = require('extract-zip')
const rimraf = require('rimraf')
const auth = require('../../helper/authLevels')


const LINE_LEAGUES = competitiondb.LINE_LEAGUES
const MAZE_LEAGUES = competitiondb.MAZE_LEAGUES
const LEAGUES = competitiondb.LEAGUES

const ACCESSLEVELS = require('../../models/user').ACCESSLEVELS

const base_tmp_path = __dirname + "/../../tmp/";

adminRouter.get('/:competition', function (req, res) {

    const id = req.params.competition
    const folder = Math.random().toString(32).substring(2)
    FS.mkdirsSync(base_tmp_path +folder);

    if (!auth.authCompetition(req.user, id, ACCESSLEVELS.ADMIN)) {
        return res.status(401).send({
            msg: "You have no authority to access this api"
        })
    }

    fs.writeFileSync(base_tmp_path +folder+"/version.json", JSON.stringify({'version': 19}));

    let outputCount = 0;
    var compName = "";

    //Competition
    competitiondb.competition.find({
          '_id': id
      }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get competitions",
                err: err.message
            })
        } else {
            compName = data[0].name
            fs.writeFileSync(base_tmp_path +folder+"/competition.json", JSON.stringify(data));
            outputCount++;
            if(outputCount == 8) makeZip(res,folder,compName)
        }
    })

    //Team
    competitiondb.team.find({
        'competition': id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get a competition",
                err: err.message
            })
        } else {
            fs.writeFileSync(base_tmp_path +folder+"/team.json", JSON.stringify(data));
            outputCount++;
            if(outputCount == 8) makeZip(res,folder,compName)
        }
    })

    //Round
    competitiondb.round.find({
        'competition': id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get rounds",
                err: err.message
            })
        } else {
            fs.writeFileSync(base_tmp_path +folder+"/round.json", JSON.stringify(data));
            outputCount++;
            if(outputCount == 8) makeZip(res,folder,compName)
        }
    })

    //Field
    competitiondb.field.find({
        'competition': id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get fields",
                err: err.message
            })
        } else {
            fs.writeFileSync(base_tmp_path +folder+"/field.json", JSON.stringify(data));
            outputCount++;
            if(outputCount == 8) makeZip(res,folder,compName)
        }
    })

    //LineMap
    lineMapDb.lineMap.find({
        'competition': id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get fields",
                err: err.message
            })
        } else {
            fs.writeFileSync(base_tmp_path +folder+"/lineMap.json", JSON.stringify(data));
            outputCount++;
            if(outputCount == 8) makeZip(res,folder,compName)
        }
    })

    //MazeMap
    mazeMapDb.mazeMap.find({
        'competition': id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get fields",
                err: err.message
            })
        } else {
            fs.writeFileSync(base_tmp_path +folder+"/mazeMap.json", JSON.stringify(data));
            outputCount++;
            if(outputCount == 8) makeZip(res,folder,compName)
        }
    })

    //LineRuns
    lineRunDb.lineRun.find({
        'competition': id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get fields",
                err: err.message
            })
        } else {
            fs.writeFileSync(base_tmp_path +folder+"/lineRun.json", JSON.stringify(data));
            outputCount++;
            if(outputCount == 8) makeZip(res,folder,compName)
        }
    })

    //LineRuns
    mazeRunDb.mazeRun.find({
        'competition': id
    }).lean().exec(function (err, data) {
        if (err) {
            logger.error(err)
            res.status(400).send({
                msg: "Could not get fields",
                err: err.message
            })
        } else {
            fs.writeFileSync(base_tmp_path +folder+"/mazeRun.json", JSON.stringify(data));
            outputCount++;
            if(outputCount == 8) makeZip(res,folder,compName)
        }
    })


})

function makeZip(res,folder,compName){

    var output = fs.createWriteStream(base_tmp_path + folder + '.zip');
    var archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', function() {
        res.download(base_tmp_path + folder + '.zip', compName+".rcjs", function (err) {
            if (err) {
                logger.error(err.status)
                return
            }
            rimraf(base_tmp_path +folder, function (err) {
            });
            fs.unlink(base_tmp_path  + folder + '.zip', function (err) {
            });
        });
    });

    archive.pipe(output);
    archive.directory(base_tmp_path  + folder, false);
    archive.finalize();
}


function decodeImage(source){
    if(source && source.data){
        return new Buffer(source.data,'base64');
    }
    return null
}



adminRouter.post('/restore', function (req, res) {
    const folder = Math.random().toString(32).substring(2)
    FS.mkdirsSync(base_tmp_path + 'uploads/');

    var filePath = base_tmp_path + "uploads/" + folder + ".zip"

    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, base_tmp_path + "uploads/")
        },
        filename: function (req, file, callback) {
            callback(null, folder + ".zip")
        }
    })

    var upload = multer({
        storage: storage
    }).single('rcjs')

    upload(req, res, function (err) {
        extract(filePath, {dir: base_tmp_path + "/uploads/" + folder}, function (err) {

            var updated = 0
            //Competition
            var competition = JSON.parse(fs.readFileSync( base_tmp_path + "/uploads/" + folder + "/competition.json" , 'utf8'));
            competitiondb.competition.updateOne({'_id': competition[0]._id},competition[0],{upsert: true},function (err) {
                if (err) {
                    logger.error(err)

                } else {
                }
            })

            //Team
            var team = JSON.parse(fs.readFileSync( base_tmp_path + "/uploads/" + folder + "/team.json" , 'utf8'));
            for(let i in team){
                competitiondb.team.updateOne({'_id': team[i]._id},team[i],{upsert: true},function (err) {
                    if (err) {
                        logger.error(err)
                    } else {
                    }
                })
            }

            //Round
            var round = JSON.parse(fs.readFileSync( base_tmp_path + "/uploads/" + folder + "/round.json" , 'utf8'));
            for(let i in round){
                competitiondb.round.updateOne({'_id': round[i]._id},round[i],{upsert: true},function (err) {
                    if (err) {
                        logger.error(err)
                    } else {
                    }
                })
            }

            //Field
            var field = JSON.parse(fs.readFileSync( base_tmp_path + "/uploads/" + folder + "/field.json" , 'utf8'));
            for(let i in field){
                competitiondb.field.updateOne({'_id': field[i]._id},field[i],{upsert: true},function (err) {
                    if (err) {
                        logger.error(err)
                    } else {
                    }
                })
            }

            //LineMap
            var lineMap = JSON.parse(fs.readFileSync( base_tmp_path + "/uploads/" + folder + "/lineMap.json" , 'utf8'));
            for(let i in lineMap){
                lineMapDb.lineMap.updateOne({'_id': lineMap[i]._id},lineMap[i],{upsert: true},function (err) {
                    if (err) {
                        logger.error(err)
                    } else {
                    }
                })
            }

            //LineRun
            var lineRun = JSON.parse(fs.readFileSync( base_tmp_path + "/uploads/" + folder + "/lineRun.json" , 'utf8'));
            for(let i in lineRun) {
                //Decode images
                if (lineRun[i].scoreSheet) {
                    for (let j in lineRun[i].scoreSheet.LoPImages) {
                        if (lineRun[i].scoreSheet.LoPImages[j])
                            lineRun[i].scoreSheet.LoPImages[j].data = decodeImage(lineRun[i].scoreSheet.LoPImages[j]);
                    }
                    if (lineRun[i].scoreSheet.tileDataImage)
                        lineRun[i].scoreSheet.tileDataImage.data = decodeImage(lineRun[i].scoreSheet.tileDataImage);
                    if (lineRun[i].scoreSheet.evacuationLevelImage)
                        lineRun[i].scoreSheet.evacuationLevelImage.data = decodeImage(lineRun[i].scoreSheet.evacuationLevelImage);
                    if (lineRun[i].scoreSheet.evacuationBonusImage)
                        lineRun[i].scoreSheet.evacuationBonusImage.data = decodeImage(lineRun[i].scoreSheet.evacuationBonusImage);
                    if (lineRun[i].scoreSheet.rescuedVictimsImage)
                        lineRun[i].scoreSheet.rescuedVictimsImage.data = decodeImage(lineRun[i].scoreSheet.rescuedVictimsImage);
                    if (lineRun[i].scoreSheet.timeImage)
                        lineRun[i].scoreSheet.timeImage.data = decodeImage(lineRun[i].scoreSheet.timeImage);
                    if (lineRun[i].scoreSheet.commentFieldImage)
                        lineRun[i].scoreSheet.commentFieldImage.data = decodeImage(lineRun[i].scoreSheet.commentFieldImage);
                    if (lineRun[i].scoreSheet.acceptResultImage)
                        lineRun[i].scoreSheet.acceptResultImage.data = decodeImage(lineRun[i].scoreSheet.acceptResultImage);
                    if (lineRun[i].scoreSheet.fullSheet)
                        lineRun[i].scoreSheet.fullSheet.data = decodeImage(lineRun[i].scoreSheet.fullSheet);
                }

                lineRunDb.lineRun.updateOne({'_id': lineRun[i]._id},lineRun[i],{upsert: true},function (err) {
                    if (err) {
                        logger.error(err)
                    } else {
                    }
                })
            }

            //MazeMap
            var mazeMap = JSON.parse(fs.readFileSync( base_tmp_path + "/uploads/" + folder + "/mazeMap.json" , 'utf8'));
            for(let i in mazeMap){
                mazeMapDb.mazeMap.updateOne({'_id': mazeMap[i]._id},mazeMap[i],{upsert: true},function (err) {
                    if (err) {
                        logger.error(err)
                    } else {
                    }
                })
            }

            //MazeRun
            var mazeRun = JSON.parse(fs.readFileSync( base_tmp_path + "/uploads/" + folder + "/mazeRun.json" , 'utf8'));
            for(let i in mazeRun){
                //Decode images
                if(mazeRun[i].scoreSheet) {
                    if (mazeRun[i].scoreSheet.LoPImage)
                        mazeRun[i].scoreSheet.LoPImage.data = decodeImage(mazeRun[i].scoreSheet.LoPImage);
                    if (mazeRun[i].scoreSheet.misidentificationImage)
                    mazeRun[i].scoreSheet.misidentificationImage.data = decodeImage(mazeRun[i].scoreSheet.misidentificationImage);
                    if (mazeRun[i].scoreSheet.tileDataImage)
                        mazeRun[i].scoreSheet.tileDataImage.data = decodeImage(mazeRun[i].scoreSheet.tileDataImage);
                    if (mazeRun[i].scoreSheet.exitBonusImage)
                        mazeRun[i].scoreSheet.exitBonusImage.data = decodeImage(mazeRun[i].scoreSheet.exitBonusImage);
                    if (mazeRun[i].scoreSheet.timeImage)
                        mazeRun[i].scoreSheet.timeImage.data = decodeImage(mazeRun[i].scoreSheet.timeImage);
                    if (mazeRun[i].scoreSheet.commentFieldImage)
                        mazeRun[i].scoreSheet.commentFieldImage.data = decodeImage(mazeRun[i].scoreSheet.commentFieldImage);
                    if (mazeRun[i].scoreSheet.acceptResultImage)
                        mazeRun[i].scoreSheet.acceptResultImage.data = decodeImage(mazeRun[i].scoreSheet.acceptResultImage);
                    if (mazeRun[i].scoreSheet.fullSheet)
                        mazeRun[i].scoreSheet.fullSheet.data = decodeImage(mazeRun[i].scoreSheet.fullSheet);
                }
                mazeRunDb.mazeRun.updateOne({'_id': mazeRun[i]._id},mazeRun[i],{upsert: true},function (err) {
                    if (err) {
                        logger.error(err)
                    } else {
                    }
                })
            }

            rimraf(base_tmp_path + "/uploads/" + folder, function (err) {
            });
            fs.unlink(filePath, function (err) {
            });

            res.redirect('/admin/'+competition[0]._id)

        })


    })
})



adminRouter.all('*', function (req, res, next) {
    next()
})

module.exports.admin = adminRouter
