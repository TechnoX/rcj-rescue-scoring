var mongoose = require('mongoose')
var validator = require('validator')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId

var logger = require('../config/logger').mainLogger

var pathFinder = require('../helper/pathFinder')

/**
 *
 *@constructor
 *
 * @param {String} username - The username
 * @param {String} password - The password
 * @param {String} salt - The salt used, unique for every user
 * @param {Boolean} admin - If the user is admin or not
 */
var mapSchema = new Schema({
  name             : {type: String, required: true, unique: true},
  height           : {type: Number, required: true, min: 1},
  width            : {type: Number, required: true, min: 1},
  length           : {type: Number, required: true, min: 1},
  tiles            : [{
    x        : {type: Number, required: true},
    y        : {type: Number, required: true},
    z        : {type: Number, required: true},
    tileType : {type: ObjectId, ref: 'TileType', required: true},
    rot      : {type: Number, min: 0, max: 270, required: true},
    items    : {
      obstacles : {type: Number, required: true, min: 0},
      speedbumps: {type: Number, required: true, min: 0, max: 1}
    },
    levelUp  : {type: String, enum: ["top", "right", "bottom", "left"]},
    levelDown: {type: String, enum: ["top", "right", "bottom", "left"]}
  }],
  startTile        : {
    x: {type: Number, required: true, min: 0},
    y: {type: Number, required: true, min: 0},
    z: {type: Number, required: true, min: 0}
  },
  numberOfDropTiles: {type: Number, required: true, min: 0}
})

var tileTypeSchema = new Schema({
  image        : {type: String, required: true, unique: true},
  gaps         : {type: Number, required: true, min: 0},
  intersections: {type: Number, required: true, min: 0, max: 1},
  paths        : {
    "top"   : {type: String, enum: ["top", "right", "bottom", "left"]},
    "right" : {type: String, enum: ["top", "right", "bottom", "left"]},
    "bottom": {type: String, enum: ["top", "right", "bottom", "left"]},
    "left"  : {type: String, enum: ["top", "right", "bottom", "left"]}
  }
})

var Map = mongoose.model('Map', mapSchema)
var TileType = mongoose.model('TileType', tileTypeSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
module.exports.map = Map
module.exports.tileType = TileType

/*var testMap = new Map({
 name  : "Test2",
 height: 1,
 width : 2,
 length: 3,
 tiles : [{
 x    : 1,
 y    : 2,
 z    : 3,
 rot  : 0,
 items: {
 gaps         : 1,
 obstacles    : 2,
 speedbumps   : 3,
 intersections: 4
 }
 },
 {
 x    : 2,
 y    : 3,
 z    : 4,
 rot  : 90,
 items: {
 gaps         : 1,
 obstacles    : 2,
 speedbumps   : 3,
 intersections: 4
 }
 }]
 })*/

/*testMap.save(function (err, data) {
 if (err) {
 console.log(err);
 }
 else {
 console.log("saved map");
 }
 })*/

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