"use strict"
const logger = require('../config/logger').mainLogger

/**
 *
 * @param run
 * @param map Must be populated with tiletypes!
 * @returns {number}
 */
module.exports.calculateScore = function (run) {
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
