var logger = require('../config/logger').mainLogger

module.exports.calculateScore = function (run) {
  var score = 0

  if (run.showedUp !== undefined && run.showedUp) {
    score += 3
  }

  var dropTileIndexes = []

  for (var i in run.tiles) {
    var tile = run.tiles[i]

    if (tile.scoredItems.dropTiles !== undefined) {
      if (tile.scoredItems.dropTiles.length > 0) {
        dropTileIndexes = dropTileIndexes.concat(tile.index)
      }
    }
  }

  dropTileIndexes.sort(function (a, b) {
    return a - b
  })

  for (var i in run.tiles) {
    var tile = run.tiles[i]

    if (tile.scoredItems.obstacles !== undefined) {
      for (var j in tile.scoredItems.obstacles) {
        if (tile.scoredItems.obstacles[j]) {
          score += 10
        }
      }
    }
    if (tile.scoredItems.speedbumps !== undefined) {
      for (var j in tile.scoredItems.speedbumps) {
        if (tile.scoredItems.speedbumps[j]) {
          score += 5
        }
      }
    }
    if (tile.scoredItems.intersections !== undefined) {
      for (var j in tile.scoredItems.intersections) {
        if (tile.scoredItems.intersections[j]) {
          score += 15
        }
      }
    }
    if (tile.scoredItems.gaps !== undefined) {
      for (var j in tile.scoredItems.gaps) {
        if (tile.scoredItems.gaps[j]) {
          score += 10
        }
      }
    }
    if (tile.scoredItems.dropTiles !== undefined) {
      for (var j in tile.scoredItems.dropTiles) {
        if (tile.scoredItems.dropTiles[j]) {
          var count
          var index = dropTileIndexes.indexOf(tile.index[j])
	  console.log(run.LoPs);
          while(run.LoPs[index]==null){
              run.LoPs.push(0)
          }
	  console.log(run.LoPs);
	  console.log(index);
          if (index == 0) {
            count = tile.index[j]
          } else {
            count = tile.index[j] - dropTileIndexes[index - 1]
          }
         score += Math.max(count * (3 - run.LoPs[index]), 0)
        }
      }
    }
  }

  score += run.rescuedVictims * 40
  return score
}
