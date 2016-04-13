var logger = require('../config/logger').mainLogger

module.exports.findPath = function (map) {
  var tiles = []
  for (var i = 0; i < map.tiles.length; i++) {
    var tile = map.tiles[i]
    tiles[tile.x + ',' + tile.y + ',' + tile.z] = tile
  }

  var startTile = tiles[map.startTile.x + ',' + map.startTile.y + ',' + map.startTile.z]

  var startDir = ""
  var startPaths = startTile.tileType.paths
  Object.keys(startPaths).forEach(function (key, index) {
    var nextTile = tiles[nextCoord(startTile, key)]
    if (nextTile !== undefined) {
      startDir = key
    }
  })

  traverse(startTile, startDir, tiles, map, 0)

  logger.debug(tiles)
  return tiles
}

function traverse(curTile, entryDir, tiles, map, index) {
  if (curTile.index === undefined) {
    curTile.index = []
  }
  curTile.index.push(index)

  if (curTile.scoreItems === undefined) {
    curTile.scoreItems = {
      gaps : 0,
      intersections : 0,
      obstacles : 0,
      speedbumps : 0
    }
  }

  curTile.scoreItems.gaps += curTile.tileType.gaps
  curTile.scoreItems.intersections += curTile.tileType.intersections
  curTile.scoreItems.obstacles += curTile.items.obstacles
  curTile.scoreItems.speedbumps += curTile.items.speedbumps

  var nextTile = tiles[nextCoord(curTile, entryDir)]

  if (nextTile === undefined) {
    return
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
  switch ((rot + 360) % 360) {
    case 0:
      return dir
    case 90:
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
    case 180:
      return flipDir(dir)
    case 270:
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