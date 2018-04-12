"use strict"
const mongoose = require('mongoose')
const mongooseInteger = require('mongoose-integer')
const validator = require('validator')
const Schema = mongoose.Schema
const async = require('async')

const logger = require('../config/logger').mainLogger

const tileTypeSchema = new Schema({
  image        : {type: String, required: true, unique: true},
  gaps         : {
    type    : Number,
    integer : true,
    required: true,
    default : 0,
    min     : 0
  },
  intersections: {
    type    : Number,
    integer : true,
    required: true,
    default : 0,
    min     : 0
  },
  paths        : {
    "top"   : {type: String, enum: ["top", "right", "bottom", "left"]},
    "right" : {type: String, enum: ["top", "right", "bottom", "left"]},
    "bottom": {type: String, enum: ["top", "right", "bottom", "left"]},
    "left"  : {type: String, enum: ["top", "right", "bottom", "left"]}
  }
})

tileTypeSchema.plugin(mongooseInteger)

const TileType = mongoose.model('TileType', tileTypeSchema)

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
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
    "image"        : "tile-41.png",
    "gaps"         : 0,
    "intersections": 1,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddaf"
  },
  {
    "image"        : "tile-55.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "bottom"
    },
    "_id"          : "5976bc04d6ef2a2620cdfc86"
  },
  {
    "image"        : "tile-56.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddb0"
  },
  {
    "image"        : "tile-57.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "5975fb67038dda73c0f5ddb1"
  },
  {
    "image"        : "tile-58.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "5975fb67038dda73c0f5ddb2"
  },
  {
    "image"        : "tile-59.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddb3"
  },
  {
    "image"        : "tile-60.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddb4"
  },
  {
    "image"        : "tile-61.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "5975fb67038dda73c0f5ddb5"
  },
  {
    "image"        : "tile-62.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "top"   : "bottom",
      "bottom": "top"
    },
    "_id"          : "5975fb67038dda73c0f5ddb6"
  },
  {
    "image"        : "tile-63.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom",
      "left"  : "top",
      "top"   : "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddb7"
  },
  {
    "image"        : "tile-64.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "top"   : "bottom",
      "bottom": "top"
    },
    "_id"          : "5975fb67038dda73c0f5ddb8"
  },
  {
    "image"        : "tile-65.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "bottom": "right",
      "right" : "bottom"
    },
    "_id"          : "5975fb67038dda73c0f5ddb9"
  },
  {
    "image"        : "tile-66.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddba"
  },
  {
    "image"        : "tile-67.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddbb"
  },
  {
    "image"        : "tile-68.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddbc"
  },
  {
    "image"        : "tile-69.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddbd"
  },
  {
    "image"        : "tile-70.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left" : "right",
      "right": "left"
    },
    "_id"          : "5975fb67038dda73c0f5ddbe"
  },
  {
    "image"        : "tile-71.png",
    "gaps"         : 0,
    "intersections": 0,
    "paths"        : {
      "left"  : "bottom",
      "bottom": "left"
    },
    "_id"          : "5976b9b7607ff6242c06a614"
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
  tileType.save(function (err) {
    if (err) {
      if (err.code != 11000) { // Ignore duplicate key error
        logger.error(err)
      } else {
        TileType.findById(tileType._id, function (err, dbTileType) {
          if (err) {
            logger.error(err)
          } else if (dbTileType) {
            dbTileType.image = tileType.image
            dbTileType.gaps = tileType.gaps
            dbTileType.intersections = tileType.intersections
            dbTileType.paths = tileType.paths
            dbTileType.save(function (err) {
              if (err) {
                logger.error(err)
              }
            })
          }
        })
      }
    }
    else {
      logger.log("saved tiletype")
    }
  })
}