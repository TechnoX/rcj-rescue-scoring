"use strict"
const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const async = require('async')

const logger = require('../config/logger').mainLogger

const pathFinder = require('../helper/pathFinder')

const LineRun = require('./lineRun').lineRun

/**
 *
 *@constructor
 *
 * @param {String} username - The username
 * @param {String} password - The password
 * @param {String} salt - The salt used, unique for every user
 * @param {Boolean} admin - If the user is admin or not
 */
const lineMapSchema = new Schema({
  competition      : {type: ObjectId, ref: 'Competition', required: true, index: true},
  name             : {type: String, required: true},
  height           : {type: Number, required: true, min: 1},
  width            : {type: Number, required: true, min: 1},
  length           : {type: Number, required: true, min: 1},
  indexCount       : {type: Number, min: 1},
  tiles            : [{
    x        : {type: Number, required: true},
    y        : {type: Number, required: true},
    z        : {type: Number, required: true},
    tileType : {type: ObjectId, ref: 'TileType', required: true},
    rot      : {
      type: Number, required: true, validate: function (a) {
        return a == 0 || a == 90 || a == 180 || a == 270
      }
    },
    items    : {
      obstacles : {type: Number, required: true, min: 0},
      speedbumps: {type: Number, required: true, min: 0}
    },
    index    : {type: [Number], min: 0},
    levelUp  : {type: String, enum: ["top", "right", "bottom", "left"]},
    levelDown: {type: String, enum: ["top", "right", "bottom", "left"]}
  }],
  startTile        : {
    x: {type: Number, required: true, min: 0},
    y: {type: Number, required: true, min: 0},
    z: {type: Number, required: true, min: 0}
  },
  numberOfDropTiles: {type: Number, required: true, min: 0},
  finished         : {type: Boolean, default: false}
})

lineMapSchema.pre('save', function (next) {
  var self = this
  
  self.populate('tiles.tileType', function (err, populatedMap) {
    if (err) {
      return next(err)
    } else {
      self = populatedMap
      logger.debug(self)
      
      try {
        pathFinder.findPath(self)
      } catch (err) {
        logger.error(err)
        self.finished = false
      }
      
      if (self.isNew) {
        LineMap.findOne({
          competition: self.competition,
          name       : self.name
        }).populate("competition", "name").exec(function (err, dbMap) {
          if (err) {
            return next(err)
          } else if (dbMap) {
            err = new Error('Map "' + dbMap.name +
                            '" already exists in competition "' +
                            dbMap.competition.name + '"!')
            return next(err)
          } else {
            return next()
          }
        })
      } else {
        LineRun.findOne({
          map    : self._id,
          started: true
        }).lean().exec(function (err, dbRun) {
          if (err) {
            return next(err)
          } else if (dbRun) {
            err = new Error('Map "' + self.name +
                            '" used in started runs, cannot modify!')
            return next(err)
          } else {
            return next()
          }
        })
      }
    }
  })
})

const tileSetSchema = new Schema({
  name : {type: String, required: true, unique: true},
  tiles: [{
    tileType: {type: ObjectId, ref: 'TileType', required: true},
    count   : {type: Number, default: 1}
  }]
})

const tileTypeSchema = new Schema({
  image        : {type: String, required: true, unique: true},
  gaps         : {type: Number, required: true, default: 0, min: 0},
  intersections: {type: Number, required: true, default: 0, min: 0},
  paths        : {
    "top"   : {type: String, enum: ["top", "right", "bottom", "left"]},
    "right" : {type: String, enum: ["top", "right", "bottom", "left"]},
    "bottom": {type: String, enum: ["top", "right", "bottom", "left"]},
    "left"  : {type: String, enum: ["top", "right", "bottom", "left"]}
  }
})

const LineMap = mongoose.model('LineMap', lineMapSchema)
const TileSet = mongoose.model('TileSet', tileSetSchema)
const TileType = mongoose.model('TileType', tileTypeSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.lineMap = LineMap
module.exports.tileSet = TileSet
module.exports.tileType = TileType

const tileTypes = [
  {
    "image"        : "tile-0.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af90"
  },
  {
    "image"        : "tile-1.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af91"
  },
  {
    "image"        : "tile-2.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af92"
  },
  {
    "image"        : "tile-3.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left"  : "bottom",
      "bottom": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af93"
  },
  {
    "image"        : "tile-4.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left"  : "top",
      "top"   : "left",
      "right" : "bottom",
      "bottom": "right"
    },
    "_id"          : "570c27c3f5a9dabe23f3af94"
  },
  {
    "image"        : "tile-5.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left"  : "bottom",
      "bottom": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af95"
  },
  {
    "image"        : "tile-6.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left"  : "bottom",
      "bottom": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af96"
  },
  {
    "image"        : "tile-7.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "top"   : "bottom",
      "bottom": "top"
    },
    "_id"          : "570c27c3f5a9dabe23f3af97"
  },
  {
    "image"        : "tile-8.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af98"
  },
  {
    "image"        : "tile-9.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af99"
  },
  {
    "image"        : "tile-10.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left"  : "bottom",
      "bottom": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af9a"
  },
  {
    "image"        : "tile-11.png",
    "gaps"         : 2,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af9b"
  },
  {
    "image"        : "tile-11_2.png",
    "gaps"         : 1,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "58cfe0d457501b50da7afa62"
  },
  {
    "image"        : "tile-12.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "right" : "bottom",
      "bottom": "right"
    },
    "_id"          : "570c27c3f5a9dabe23f3af9c"
  },
  {
    "image"        : "tile-13.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af9d"
  },
  {
    "image"        : "tile-14.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af9e"
  },
  {
    "image"        : "tile-15.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left" : "top",
      "top"  : "left",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3af9f"
  },
  {
    "image"        : "tile-16.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left" : "right",
      "right": "top",
      "top"  : "right"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa0"
  },
  {
    "image"        : "tile-16_2.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left" : "top",
      "right": "top",
      "top"  : "top"
    },
    "_id"          : "58cfd29b204466244ba56a1f"
  },
  {
    "image"        : "tile-17.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa1"
  },
  {
    "image"        : "tile-18.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa2"
  },
  {
    "image"        : "tile-19.png",
    "gaps"         : 1,
    "intersections": 0,
    "paths"        : {
      "left"  : "right",
      "right" : "left",
      "top"   : "bottom",
      "bottom": "top"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa3"
  },
  {
    "image"        : "tile-20.png",
    "gaps"         : 1,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa4"
  },
  {
    "image"        : "tile-21.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa5"
  },
  {
    "image"        : "tile-22.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa6"
  },
  {
    "image"        : "tile-23.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa7"
  },
  {
    "image"        : "tile-24.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa8"
  },
  {
    "image"        : "tile-25.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left"  : "top",
      "top"   : "left",
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "570c27c3f5a9dabe23f3afa9"
  },
  {
    "image"        : "tile-26.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "570c27c3f5a9dabe23f3afaa"
  },
  {
    "image"        : "tile-27.png",
    "gaps"         : 0,
    "intersections": 2,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "570c27c3f5a9dabe23f3afab"
  },
  {
    "image"        : "tile-28.png",
    "gaps"         : 1,
    "intersections": 2,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3afac"
  },
  {
    "image"        : "tile-29.png",
    "gaps"         : 0,
    "intersections": 2,
    "paths"        : {
      "left"  : "bottom",
      "bottom": "left"
    },
    "_id"          : "570c27c3f5a9dabe23f3afad"
  },
  {
    "image"        : "tile-30.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left"  : "right",
      "bottom": "top",
      "right" : "top",
      "top"   : "right"
    },
    "_id"          : "570c27c3f5a9dabe23f3afae"
  },
  {
    "image"        : "tile-31.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left"  : "top",
      "bottom": "top",
      "right" : "top",
      "top"   : "top"
    },
    "_id"          : "58cfd29b204466244ba56a20"
  },
  {
    "image"        : "tile-32.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left"  : "top",
      "top"   : "left",
      "right" : "bottom",
      "bottom": "right"
    },
    "_id"          : "570c27c3f5a9dabe23f3afb2"
  },
  {
    "image"        : "tile-33.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left"  : "left",
      "bottom": "bottom",
      "right" : "bottom",
      "top"   : "left"
    },
    "_id"          : "58cfd29b204466244ba56a21"
  },
  {
    "image"        : "tile-34.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left"  : "left",
      "bottom": "bottom",
      "right" : "right",
      "top"   : "top"
    },
    "_id"          : "58cfd29b204466244ba56a22"
  },
  {
    "image"        : "tile-35.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left"  : "right",
      "top"   : "bottom",
      "right" : "left",
      "bottom": "top"
    },
    "_id"          : "570c27c3f5a9dabe23f3afb4"
  },
  {
    "image"        : "007.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "right" : "bottom",
      "bottom": "right"
    },
    "_id"          : "58cfd6549792e9313b1610d2"
  },
  {
    "image"        : "009.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "right" : "bottom",
      "bottom": "right"
    },
    "_id"          : "58cfd6549792e9313b1610d3"
  },
  {
    "image"        : "010.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "right": "left",
      "left" : "right"
    },
    "_id"          : "58cfd6549792e9313b1610d4"
  },
  {
    "image"        : "011.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "right": "left",
      "left" : "right"
    },
    "_id"          : "58cfd6549792e9313b1610d5"
  },
  {
    "image"        : "021.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "right": "left",
      "left" : "right"
    },
    "_id"          : "58cfd6549792e9313b1610d6"
  },
  {
    "image"        : "022.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "right": "left",
      "left" : "right"
    },
    "_id"          : "58cfd6549792e9313b1610d7"
  },
  {
    "image"        : "025.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "right": "left",
      "left" : "right"
    },
    "_id"          : "58cfd6549792e9313b1610d8"
  }
]

for (var i in tileTypes) {
  const tileType = new TileType(tileTypes[i])
  tileType.save(function (err, data) {
    if (err) {
      if (err.code != 11000) { // Ignore duplicate key error
        console.log(err)
      }
    }
    else {
      console.log("saved tiletype")
    }
  })
}

pathFinder.findPath({
    name     : "Test2",
    height   : 1,
    width    : 2,
    length   : 3,
    tiles    : [{
      x       : 1,
      y       : 1,
      z       : 1,
      rot     : 0,
      items   : {
        obstacles : 2,
        speedbumps: 3
      },
      tileType: {
        gaps         : 0,
        intersections: 0,
        paths        : {
          "right": "left",
          "left" : "right"
        }
      }
    },
      {
        x       : 2,
        y       : 1,
        z       : 1,
        rot     : 0,
        items   : {
          obstacles : 2,
          speedbumps: 3
        },
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "right": "bottom",
            "left" : "right"
          }
        }
      },
      {
        x       : 3,
        y       : 1,
        z       : 1,
        rot     : 0,
        items   : {
          obstacles : 1,
          speedbumps: 1
        },
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "bottom": "left",
            "left"  : "bottom"
          }
        }
      },
      {
        x       : 3,
        y       : 2,
        z       : 1,
        rot     : 90,
        items   : {
          obstacles : 2,
          speedbumps: 3
        },
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "right": "left",
            "left" : "right"
          }
        }
      },
      {
        x       : 3,
        y       : 3,
        z       : 1,
        rot     : 270,
        items   : {
          obstacles : 2,
          speedbumps: 3
        },
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "right": "left",
            "left" : "right"
          }
        }
      },
      {
        x       : 3,
        y       : 4,
        z       : 1,
        rot     : 0,
        items   : {
          obstacles : 2,
          speedbumps: 3
        },
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "top": "top"
          }
        }
      },
      {
        x       : 2,
        y       : 2,
        z       : 1,
        rot     : 0,
        items   : {
          obstacles : 2,
          speedbumps: 3
        },
        tileType: {
          gaps         : 1,
          intersections: 0,
          paths        : {
            "top"   : "bottom",
            "bottom": "top"
          }
        },
        levelUp : "bottom"
      }
      ,
      {
        x        : 2,
        y        : 3,
        z        : 2,
        rot      : 0,
        items    : {
          obstacles : 2,
          speedbumps: 3
        },
        tileType : {
          gaps         : 1,
          intersections: 0,
          paths        : {
            "top"   : "bottom",
            "bottom": "top"
          }
        },
        levelDown: "top"
      }
    ],
    startTile: {x: 1, y: 1, z: 1}
  }
)