"use strict"
const logger = require('../config/logger').mainLogger

/**
 *
 * @param run Must be populated with map and tiletypes!
 * @returns {number}
 */
module.exports.calculateLineScore = function (run) {
  var score = 0

  var mapTiles = []
  for (let i = 0; i < run.map.tiles.length; i++) {
    let tile = run.map.tiles[i]

    for (let j = 0; j < tile.index.length; j++) {
      let index = tile.index[j]

      mapTiles[index] = tile
    }
  }

  let lastDropTile = 0
  let dropTileCount = 0

  for (let i = 0; i < run.tiles.length; i++) {
    let tile = run.tiles[i]

    if (tile.scored) {
      if (tile.isDropTile) {
        let tileCount = i - lastDropTile
        score += Math.max(tileCount * (3 - run.LoPs[dropTileCount]), 0)
      }

      score += mapTiles[i].tileType.gaps * 10
      score += mapTiles[i].tileType.intersections * 15
      score += mapTiles[i].items.obstacles * 10
      score += mapTiles[i].items.speedbumps * 5
    }

    if (tile.isDropTile) {
      lastDropTile = i
      dropTileCount++
    }
  }

  if (run.evacuationLevel == 1) {
    score += run.rescuedLiveVictims * 30
    score += run.rescuedDeadVictims * 15

  } else if (run.evacuationLevel == 2) {
    score += run.rescuedLiveVictims * 40
    score += run.rescuedDeadVictims * 20
  }

  if (run.exitBonus) {
    score += 20
  }

  // 3 points for placing robot on first droptile (start)
  // Implicit showedUp if anything else is scored
  if (run.showedUp || score > 0) {
    score += 3
  }

  return score
}

/**
 *
 * @param run Must be populated with map!
 * @returns {number}
 */
module.exports.calculateMazeScore = function (run) {
  var score = 0

  var mapTiles = []
  for (let i = 0; i < run.map.tiles.length; i++) {
    let tile = run.map.tiles[i]

    mapTiles[tile.x + ',' + tile.y + ',' + tile.z] = tile
  }

  var victims = 0
  var rescueKits = 0

  for (let i = 0; i < run.tiles.length; i++) {
    const tile = run.tiles[i]
    const coord = tile.x + ',' + tile.y + ',' + tile.z

    if (tile.scoredItems.speedbump && mapTiles[coord].tile.speedbump) {
      score += 5
    }

    if (tile.scoredItems.checkpoint && mapTiles[coord].tile.checkpoint) {
      score += 10
    }
    if (tile.scoredItems.rampBottom && mapTiles[coord].tile.rampBottom) {
      score += 10
    }
    if (tile.scoredItems.rampTop && mapTiles[coord].tile.rampTop) {
      score += 20
    }

    const maxKits = {
      "H"     : 2,
      "S"     : 1,
      "U"     : 0,
      "Heated": 1
    }

    if (mapTiles[coord].tile.victims.top != "None") {
      if (tile.victims.top) {
        victims++
        score += mapTiles[coord].isLinear ? 10 : 25
        rescueKits += min(tile.rescueKits.top, maxKits[mapTiles[coord].tile.victims.top])
      }
    }
    if (mapTiles[coord].tile.victims.right != "None") {
      if (tile.victims.right) {
        victims++
        score += mapTiles[coord].isLinear ? 10 : 25
        rescueKits += min(tile.rescueKits.right, maxKits[mapTiles[coord].tile.victims.right])
      }
    }
    if (mapTiles[coord].tile.victims.bottom != "None") {
      if (tile.victims.bottom) {
        victims++
        score += mapTiles[coord].isLinear ? 10 : 25
        rescueKits += min(tile.rescueKits.bottom, maxKits[mapTiles[coord].tile.victims.bottom])
      }
    }
    if (mapTiles[coord].tile.victims.left != "None") {
      if (tile.victims.left) {
        victims++
        score += mapTiles[coord].isLinear ? 10 : 25
        rescueKits += min(tile.rescueKits.left, maxKits[mapTiles[coord].tile.victims.left])
      }
    }

    if (tile.scoredItems.checkpoint && mapTiles[coord].tile.checkpoint) {
      score += 10
    }
  }

  score += rescueKits * 10

  score += max((victims + rescueKits - run.LoPs) * 10, 0)

  if (run.exitBonus) {
    score += victims * 10
  }

  return score
}
