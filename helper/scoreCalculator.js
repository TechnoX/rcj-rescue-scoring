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
        score += Math.max(tileCount * (5 - 2 * run.LoPs[dropTileCount]), 0)
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
    score += run.rescuedLiveVictims * Math.max(30 - 5 * run.LoPs[dropTileCount], 0)
    score += run.rescuedDeadVictims * Math.max(15 - 5 * run.LoPs[dropTileCount], 0)
    
  } else if (run.evacuationLevel == 2) {
    score += run.rescuedLiveVictims * Math.max(40 - 5 * run.LoPs[dropTileCount], 0)
    score += run.rescuedDeadVictims * Math.max(20 - 5 * run.LoPs[dropTileCount], 0)
  }
  
  if (run.exitBonus) {
    score += 20
  }
  
  // 5 points for placing robot on first droptile (start)
  // Implicit showedUp if anything else is scored
  if (run.showedUp || score > 0) {
    score += 5
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
  for (let i = 0; i < run.map.cells.length; i++) {
    let cell = run.map.cells[i]
    if (cell.isTile) {
      mapTiles[cell.x + ',' + cell.y + ',' + cell.z] = cell
    }
  }
  
  var victims = 0
  var rescueKits = 0
  
  for (let i = 0; i < run.tiles.length; i++) {
    const tile = run.tiles[i]
    const coord = tile.x + ',' + tile.y + ',' + tile.z
    
    if (mapTiles[coord].tile.reachable) {
      
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
        if (tile.scoredItems.rescueKits.top > 0) {
          tile.scoredItems.victims.top = true
        }
        if (tile.scoredItems.victims.top) {
          victims++
          score += mapTiles[coord].isLinear ? 10 : 25
          rescueKits += Math.min(tile.scoredItems.rescueKits.top, maxKits[mapTiles[coord].tile.victims.top])
        }
      }
      if (mapTiles[coord].tile.victims.right != "None") {
        if (tile.scoredItems.rescueKits.right > 0) {
          tile.scoredItems.victims.right = true
        }
        if (tile.scoredItems.victims.right) {
          victims++
          score += mapTiles[coord].isLinear ? 10 : 25
          rescueKits += Math.min(tile.scoredItems.rescueKits.right, maxKits[mapTiles[coord].tile.victims.right])
        }
      }
      if (mapTiles[coord].tile.victims.bottom != "None") {
        if (tile.scoredItems.rescueKits.bottom > 0) {
          tile.scoredItems.victims.bottom = true
        }
        if (tile.scoredItems.victims.bottom) {
          victims++
          score += mapTiles[coord].isLinear ? 10 : 25
          rescueKits += Math.min(tile.scoredItems.rescueKits.bottom, maxKits[mapTiles[coord].tile.victims.bottom])
        }
      }
      if (mapTiles[coord].tile.victims.left != "None") {
        if (tile.scoredItems.rescueKits.left > 0) {
          tile.scoredItems.victims.left = true
        }
        if (tile.scoredItems.victims.left) {
          victims++
          score += mapTiles[coord].isLinear ? 10 : 25
          rescueKits += Math.min(tile.scoredItems.rescueKits.left, maxKits[mapTiles[coord].tile.victims.left])
        }
      }
    }
  }
  score += Math.min(rescueKits, 12) * 10
  
  score += Math.max((victims + Math.min(rescueKits, 12) - run.LoPs) * 10, 0)
  
  if (run.exitBonus) {
    score += victims * 10
  }
  
  return score
}
