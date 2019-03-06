var logger = require('../config/logger').mainLogger

module.exports.findPath = function (map) {
  var tiles = []
  for (var i = 0; i < map.tiles.length; i++) {
    var tile = map.tiles[i]
    tile.index = []
    tiles[tile.x + ',' + tile.y + ',' + tile.z] = tile
  }
  
  var startTile = tiles[map.startTile.x + ',' + map.startTile.y + ',' +
                        map.startTile.z]
  
  var startDir = ""
  var startPaths = startTile.tileType.paths
  Object.keys(startPaths).forEach(function (dir, index) {
    var nextTile = tiles[nextCoord(startTile, dir)]
    if (nextTile !== undefined) {
      startDir = dir
    }
  })
  
  traverse(startTile, startDir, tiles, map, 0)
}

/**
 *
 * @param curTile
 * @param entryDir {
 * @param tiles
 * @param map
 * @param index {Number}
 */
function traverse(curTile, entryDir, tiles, map, index) {
  curTile.index.push(index)
  
  var nextTile = tiles[nextCoord(curTile, entryDir)]
  
  if (nextTile === undefined) {
    map.indexCount = index + 1
    return
  }
  
  if (nextTile.z != curTile.z) {
    nextTile.items.ramp = true
  }
  
  traverse(nextTile, flipDir(exitDir(curTile, entryDir)), tiles, map, index + 1)
}

function exitDir(curTile, entryDir) {
  var dir = rotateDir(entryDir, -curTile.rot)
  var exit = rotateDir(curTile.tileType.paths[dir], curTile.rot)
  return exit
}

function nextCoord(curTile, entryDir) {
  var exit = exitDir(curTile, entryDir)
  var coord
  switch (exit) {
    case "top":
      coord = curTile.x + ',' + (curTile.y - 1)
      break
    case "right":
      coord = (curTile.x + 1) + ',' + curTile.y
      break
    case "bottom":
      coord = curTile.x + ',' + (curTile.y + 1)
      break
    case "left":
      coord = (curTile.x - 1) + ',' + curTile.y
      break
  }
  
  if (curTile.levelUp !== undefined && exit == curTile.levelUp) {
    coord += ',' + (curTile.z + 1)
  } else if (curTile.levelDown !== undefined && exit == curTile.levelDown) {
    coord += ',' + (curTile.z - 1)
  } else {
    coord += ',' + curTile.z
  }
  
  return coord
}

function rotateDir(dir, rot) {
  switch (rot) {
    case 0:
      return dir
    
    case -270:
    case 90:
      switch (dir) {
        case "top":
          return "right"
        case "right":
          return "bottom"
        case "bottom":
          return "left"
        case "left":
          return "top"
      }
    
    case -180:
    case 180:
      return flipDir(dir)
    
    case -90:
    case 270:
      switch (dir) {
        case "top":
          return "left"
        case "right":
          return "top"
        case "bottom":
          return "right"
        case "left":
          return "bottom"
      }
  }
}

function flipDir(dir) {
  switch (dir) {
    case "top":
      return "bottom"
    case "right":
      return "left"
    case "bottom":
      return "top"
    case "left":
      return "right"
  }
}