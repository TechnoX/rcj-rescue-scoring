"use strict"
const logger = require('../config/logger').mainLogger

module.exports.calculateScore = function (run, map) {
  return 0 // XXX:FIXME!
  var score = 0

  // 3 points for placing robot on first droptile (start)
  if (run.showedUp) {
    score += 3
  }

  var dropTileIndexes = []

  for (let i = 0; i < run.tiles.length; i++) {
    let tile = run.tiles[i]

    if (tile.isDropTile) {
      dropTileIndexes.push(i)
    }
  }

  for (let i = 0; i < run.tiles.length; i++) {
    let tile = run.tiles[i]

    if (tile.scoredItems.obstacles) {
      score += 10
    }
    if (tile.scoredItems.speedbumps) {
      score += 5
    }
    if (tile.scoredItems.intersection) {
      score += 15
    }
    if (tile.scoredItems.gaps) {
      score += 10
    }

    if (tile.scoredItems.dropTile) {
      var index = dropTileIndexes.indexOf(tile.index[j])

      while (run.LoPs[index] == null) {
        run.LoPs.push(0)
      }

      if (index == 0) {
        count = tile.index[j]
      } else {
        count = tile.index[j] - dropTileIndexes[index - 1]
      }
      score += Math.max(count * (3 - run.LoPs[index]), 0)
    }
  }

  score += run.rescuedVictims * 40
  return score
}
