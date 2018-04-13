"use strict"
const mongoose = require('mongoose')
const validator = require('validator')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const logger = require('../config/logger').mainLogger

const Map = require('./map.model')
const mazeFill = require('../leagues/maze/mazeFill')

const VICTIMS = ['H', 'S', 'U', "Heated", "None"]
module.exports.VICTIMS = VICTIMS

function isOdd(n) {
  return n & 1 // Bitcheck LSB
}
function isEven(n) {
  return !isOdd(n)
}


const tileSchema = new Schema({
  reachable    : {type: Boolean, default: false},
  checkpoint   : {type: Boolean, default: false},
  speedbump    : {type: Boolean, default: false},
  black        : {type: Boolean, default: false},
  rampBottom   : {type: Boolean, default: false},
  rampTop      : {type: Boolean, default: false},
  victims      : {
    top   : {
      type   : String,
      enum   : VICTIMS,
      default: "None"
    },
    right : {
      type   : String,
      enum   : VICTIMS,
      default: "None"
    },
    bottom: {
      type   : String,
      enum   : VICTIMS,
      default: "None"
    },
    left  : {
      type   : String,
      enum   : VICTIMS,
      default: "None"
    }
  },
  changeFloorTo: {type: Number, integer: true, min: 0}
})

const mazeMapSchema = new Schema({
  competition: {
    type    : ObjectId,
    ref     : 'Competition',
    required: true,
    index   : true
  },
  name       : {type: String, required: true},
  height     : {type: Number, integer: true, required: true, min: 1},
  width      : {type: Number, integer: true, required: true, min: 1},
  length     : {type: Number, integer: true, required: true, min: 1},
  cells      : [{
    x       : {type: Number, integer: true, required: true, min: 0},
    y       : {type: Number, integer: true, required: true, min: 0},
    z       : {type: Number, integer: true, required: true, min: 0},
    isTile  : {type: Boolean, default: false},
    isWall  : {type: Boolean, default: false},
    isLinear: {type: Boolean, default: false},
    
    tile: tileSchema
    
  }],
  startTile  : {
    x: {
      type    : Number,
      integer : true,
      required: true,
      min     : 1,
      validate: {validator: isOdd, message: '{VALUE} is not odd (not a tile)!'}
    },
    y: {
      type    : Number,
      integer : true,
      required: true,
      min     : 1,
      validate: {validator: isOdd, message: '{VALUE} is not odd (not a tile)!'}
    },
    z: {type: Number, integer: true, required: true, min: 0}
  },
  finished   : {type: Boolean, default: 0}
})

mazeMapSchema.pre('save', function (next) {
  var self = this
  
  for (let i = 0; i < self.cells.length; i++) {
    let cell = self.cells[i]
    
    if (cell.x > self.width * 2 || cell.y > self.length * 2 ||
        cell.z >= self.height) {
      self.cells.splice(i, 1)
      continue
    }
    
    if (isOdd(cell.x) && isOdd(cell.y)) {
      cell.isTile = true
      cell.isWall = false
      
      if (cell.tile == null) {
        cell.tile = {}
      }
      
      if (cell.x == self.startTile.x && cell.y == self.startTile.y &&
          cell.z == self.startTile.z) {
        cell.tile.checkpoint = true
      }
      
      if (cell.tile.black) {
        if (cell.tile.checkpoint) {
          const err = new Error("Tile can't be both black and checkpoint at x: " +
                                cell.x + ", y: " +
                                cell.y + ", z: " + cell.z + "!")
          return next(err)
        }
        
        if (cell.tile.rampBottom) {
          const err = new Error("Tile can't be both black and ramp bottom at x: " +
                                cell.x + ", y: " +
                                cell.y + ", z: " + cell.z + "!")
          return next(err)
        }
        
        if (cell.tile.rampTop) {
          const err = new Error("Tile can't be both black and ramp top at x: " +
                                cell.x + ", y: " +
                                cell.y + ", z: " + cell.z + "!")
          return next(err)
        }
        
        if ((cell.tile.victims.top != null &&
             cell.tile.victims.top != "None") ||
        
            (cell.tile.victims.right != null &&
             cell.tile.victims.right != "None") ||
        
            (cell.tile.victims.bottom != null &&
             cell.tile.victims.bottom != "None") ||
        
            (cell.tile.victims.left != null &&
             cell.tile.victims.left != "None")) {
          
          const err = new Error("Can't have victims on black tile at x: " +
                                cell.x + ", y: " +
                                cell.y + ", z: " + cell.z + "!")
          return next(err)
        }
      }
      
    } else if (isEven(cell.x) && isEven(cell.y)) {
      const err = new Error("Illegal cell placement at x: " + cell.x + ", y: " +
                            cell.y + ", z: " + cell.z + "!")
      return next(err)
    } else {
      if (!cell.isWall) {
        self.cells.splice(i, 1)
      } else {
        cell.isTile = false
        delete cell.tile
      }
    }
  }
  
  if (self.finished) {
    mazeFill.floodFill(self)
    mazeFill.linearFill(self)
    //logger.debug(JSON.stringify(self))
  }
  
  return next()
})

/*
 Workaround for calling overridden methods in base model
 To call for example method foo(arg1, arg2) do
 base.foo.call(this, arg1, arg2)
 To bind "this" to the current document
 */
const base = Map.schema.methods
mazeMapSchema.methods = {
  updateFilter(data) {
    let filteredData = base.updateFilter.call(this, data)

    Object.assign(filteredData, {
      height           : data.height,
      width            : data.width,
      length           : data.length,
      tiles            : data.tiles, // TODO: Refine this
      startTile        : data.startTile ? {
        x: data.startTile.x,
        y: data.startTile.y,
        z: data.startTile.z
      } : undefined,
      numberOfDropTiles: data.numberOfDropTiles
    })

    // Stringify and parse to remove undefined properties
    return JSON.parse(JSON.stringify(filteredData))
  }
}

/** Mongoose model {@link http://mongoosejs.com/docs/models.html} */
const MazeMap = module.exports = Map.discriminator("MazeMap", mazeMapSchema)
