const PDFDocument = require('pdfkit');
const pdf = require('./scoreSheetPDFUtil');
const defs = require('./scoreSheetUtil');
const logger = require('../config/logger').mainLogger;

/**
 * Defines some important numbers for the placement of different objects in the scoresheet.
 */
const globalConfig = {
  positionMarkersSize: 20, // Must be the largest object
  positionMarkers: [
    {x: 10, y: 20}, // upper left
    {x: 10, y: 760}, // lower left
    {x: 570, y: 760}, // lower right
  ],
  margin: {
    left: 30,
    top: 100
  },
  checkboxSize: 7,
  fields: {
    tileSize: 30,
    checkbox: {
      marginBorder: 1,
      marginCheckbox: 2
    },
    tileSpacing: 2, // Spacing between tiles
    positions: [ // Position for each z level. The scoring sheet can handle up to n levels.
      {x: 0, y: 0}, // Level 0
      {x: 0, y: 325} // Level 1
    ]
  },
  data: {
    marginLeft: 330, // Distance from config.margin.left to text
    metadata: {
      sizeQR: 57,
      text: {
        fontSize: 11
      }
    },
    inputs: {
      textFieldWidth: 40, // Width of field where human writes down number human readable
      labelFontSize: 12,
      marginsVertical: 8 // Vertical space between two input fields
    }
  },
  signature: {
    width: 200,
    height: 30
  }
};

/**
 * Calculates the worst case amount of checkpoint passings based a map
 * and the amount of checkpoint markers
 * @param checkpointMarkersAmount amount of checkpoint marker
 * @param tiles
 * @returns {number}
 */
function calculateWorstCaseCheckpointAmount(map) {
  let sortedTiles = map.tiles.slice(0).sort((t1, t2) => t2.index.length - t1.index.length);
  let checkpointAmount = 0;
  let usedCheckpointMarkers = 0;
  for (let i = 0; i < sortedTiles.length && usedCheckpointMarkers < map.numberOfDropTiles; i++) {
    if (sortedTiles[i].items.obstacles === 0 && sortedTiles[i].items.speedbumps === 0 && sortedTiles[i].items.rampPoints === false) {
      checkpointAmount += sortedTiles[i].index.length;
      usedCheckpointMarkers ++;
    }
  }
  return checkpointAmount;
}

function drawFields(doc, pos_x, pos_y, config, map, stiles) {
  const mapLevelHeight = map.width * (config.fields.tileSize + config.fields.tileSpacing) + 2 - config.fields.tileSpacing;
  const mapLevelWidth = map.length * (config.fields.tileSize + config.fields.tileSpacing) + 2 - config.fields.tileSpacing;

  const posData = {
    type: defs.InputTypeEnum.FIELD,
    x: pos_x + config.fields.positions[0].x,
    y: pos_y + config.fields.positions[0].y,
    w: config.fields.positions[1].x + mapLevelWidth,
    h: config.fields.positions[1].y + mapLevelHeight,
    children: []
  };

  for (let z = 0; z < map.height && z < config.fields.positions.length; z++) {
    doc.lineWidth(1)
      .rect(
        pos_x + config.fields.positions[z].x,
        pos_y + config.fields.positions[z].y,
        mapLevelHeight,
        mapLevelWidth
      )
      .fillAndStroke("#EFEFEF", "black")
  }

  pos_x++;
  pos_y++;

  for (let i = 0; i < map.tiles.length; i++) {
    const tile = map.tiles[i];
    if (tile.z >= config.fields.positions.length) {
      console.log("Warning: Score sheet can't handle enough line levels!");
      continue // Skip levels that have no position data
    }

    const tile_pos_x = pos_x + config.fields.positions[tile.z].x + tile.x * (config.fields.tileSize + config.fields.tileSpacing);
    const tile_pos_y = pos_y + config.fields.positions[tile.z].y + tile.y * (config.fields.tileSize + config.fields.tileSpacing);

    doc.save();
    doc.rotate(tile.rot, {
      origin: [
        tile_pos_x + (config.fields.tileSize / 2),
        tile_pos_y + (config.fields.tileSize / 2)
      ]
    });
    doc.image("public/images/tiles/" + tile.tileType.image,
      tile_pos_x,
      tile_pos_y, {width: config.fields.tileSize});
    doc.restore();

    posData.children.push({
      type: defs.InputTypeEnum.FIELDTILE,
      x: tile_pos_x,
      y: tile_pos_y,
      w: config.fields.tileSize,
      h: config.fields.tileSize,
      children: []
    });

    if (tile.levelUp || tile.levelDown) {
      doc.save();

      function dirToAngle(dir) {
        switch (dir) {
          case "bottom":
            return 0;
          case "right":
            return 90;
          case "top":
            return 180;
          case "left":
            return 270;
        }
        return 0;
      }

      doc.rotate(dirToAngle(tile.levelUp || tile.levelDown), {
        origin: [
          tile_pos_x + (config.fields.tileSize / 2),
          tile_pos_y + (config.fields.tileSize / 2)
        ]
      });
      /* doc.image("public/images/" + (tile.levelUp ? "up.png" : "down.png"),
         tile_pos_x + (config.fields.tileSize / 2),
         tile_pos_y + (config.fields.tileSize / 2), {width: config.fields.tileSize / 2});*/
      doc.restore()
    }

    if (map.startTile.x === tile.x && map.startTile.y === tile.y && map.startTile.z === tile.z) {
      pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "St", "start", "#0080FF", tile.index[0])
    }
    for (let i = 0, indexNum; indexNum = tile.index[i]; i++) {
      let stile = stiles[indexNum];
      for (let j = 0; j < stile.scoredItems.length; j++) {
        switch (stile.scoredItems[j]) {
          case "obstacle":
            pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "O", "obstacle", i === 0 ? "#A4603C" : "#CAA28D", indexNum);
            break;
          case "speedbump":
            pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "S", "speedbump", i === 0 ? "#046D0E" : "#5CD717", indexNum);
            break;
          case "gap":
            pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "G", "gap", i === 0 ? "#3A045E" : "#9124CF", indexNum);
            break;
          case "intersection":
            pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "I", "intersection", i === 0 ? "#B8080B" : "#FD0509", indexNum);
            break;
          case "ramp":
            pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "R", "ramp", i === 0 ? "#EB39E8" : "#F480F2", indexNum);
            break;
          case "checkpoint":
            if (posData.children[posData.children.length - 1].children.length === 1) {
              // Don't add multiple checkpoints for multiple passings since we only want to know the position
              break;
            }

            const posCheckbox = pdf.drawCheckbox(
              doc,
              posData.children[posData.children.length - 1].x + config.fields.tileSize - config.fields.checkbox.marginBorder - (config.checkboxSize * 2),
              posData.children[posData.children.length - 1].y + config.fields.tileSize - config.fields.checkbox.marginBorder - config.checkboxSize,
              config.checkboxSize,
              "C",
              defs.DirsEnum.RIGHT,
              "#0080FF"
            );
            posCheckbox.posData.meta = {
              id: "checkpoint",
              tileIndex: indexNum
            };
            posData.children[posData.children.length - 1].children.push(posCheckbox.posData);
            break;
        }
      }
    }
  }

  return {
    x: pos_x + config.fields.positions[0].x + mapLevelWidth,
    y: pos_y + config.fields.positions[1].y + mapLevelHeight,
    posData: posData
  };
}

function drawRun(doc, config, scoringRun) {
  let posDatas = [];
  let pos_y = config.margin.top;
  let pos_x = config.margin.left;

  function savePos(pos, descr) {
    posDatas.push({descr: descr, posData: pos.posData});
    return pos;
  }

  function nextItem(pos, descr) {
    savePos(pos, descr);
    pos_y = pos.y + config.data.inputs.marginsVertical;
  }

  let stiles = [];
  while (stiles.length < scoringRun.map.indexCount) {
    stiles.push({
      scoredItems: []
    });
  }
  for (let i = 0, t; t = scoringRun.map.tiles[i]; i++) {
    for (let j = 0; j < t.index.length; j++) {
      for (let k = 0; k < t.items.obstacles; k++) {
        let addSItem = "obstacle";
        stiles[t.index[j]].scoredItems.push(addSItem);
      }

      for (let k = 0; k < t.items.speedbumps; k++) {
        let addSItem = "speedbump";
        stiles[t.index[j]].scoredItems.push(addSItem);
      }

      for (let k = 0; k < t.tileType.gaps; k++) {
        let addSItem = "gap";
        stiles[t.index[j]].scoredItems.push(addSItem);
      }

      for (let k = 0; k < t.tileType.intersections; k++) {
        let addSItem = "intersection";
        stiles[t.index[j]].scoredItems.push(addSItem);
      }

      if (t.items.rampPoints) {
        let addSItem = "ramp";
        stiles[t.index[j]].scoredItems.push(addSItem);
      }
    }
  }
  for (let i = 0; i < stiles.length - 2; i++) {
    if (stiles[i].scoredItems.length === 0) {
      let addSItem = "checkpoint";
      stiles[i].scoredItems.push(addSItem);
    }
  }

  savePos(pdf.drawPositionMarkers(doc, config), "posMarkers");
  let pf = drawFields(doc, pos_x, pos_y, config, scoringRun.map, stiles);
  savePos(pf, "field");
  pos_x += config.data.marginLeft;
  nextItem(pdf.drawMetadata(doc, pos_x, pos_y, config, scoringRun), "meta");
  nextItem(pdf.drawCheckbox(doc, pos_x, pos_y, config.checkboxSize, "Enter scoring sheet manually", defs.DirsEnum.RIGHT, "black"), "enterManually");
  nextItem(pdf.drawEvacuationInputField(doc, config, pos_x, pos_y), "evacuation");

  let checkpointAmount = calculateWorstCaseCheckpointAmount(scoringRun.map);

  if (checkpointAmount > 0) {
    let pos_x_left = pos_x;
    for (let i = 0; i < checkpointAmount; i++) {
      let pos = savePos(drawLOPInputField(doc, config, pos_x, pos_y, "Until CP " + (i + 1)), "cb" + i);
      if (i % 2 === 0 && i < (checkpointAmount - 1)) {
        pos_x = pos.x + config.data.inputs.marginsVertical;
      } else {
        pos_y = pos.y + config.data.inputs.marginsVertical;
        pos_x = pos_x_left;
      }
    }
  }

  if (scoringRun.map.victims.dead > 0) {
    nextItem(pdf.drawVictimInputField(doc, config, pos_x, pos_y, scoringRun.map.victims.dead, "dead before alive"), "victimsDeadBeforeAlive");
  }

  if (scoringRun.map.victims.live > 0) {
    nextItem(pdf.drawVictimInputField(doc, config, pos_x, pos_y, scoringRun.map.victims.live, "alive"), "victimsAlive");
  }
  if (scoringRun.map.victims.dead > 0) {
    nextItem(pdf.drawVictimInputField(doc, config, pos_x, pos_y, scoringRun.map.victims.dead, "dead after alive"), "victimsDeadAfterAlive");
  }

  nextItem(pdf.drawTimeInputField(doc, config, pos_x, pos_y), "time");
  nextItem(pdf.drawYesNoField(doc, config, pos_x, pos_y, "Exit Bonus"), "exitBonus");
  nextItem(pdf.drawTextInputField(doc, config, pos_x, pos_y, "Team:", config.signature.width, config.signature.height), "signTeam");
  nextItem(pdf.drawTextInputField(doc, config, pos_x, pos_y, "Referee:", config.signature.width, config.signature.height), "signRef");

  return posDatas
}

function drawLOPInputField(doc, config, pos_x, pos_y, text) {
  const columnText = ["N", "0", "1", "2", "3", "4", "5", "6", "7+"];
  const rowText = [""];
  return pdf.drawNumberInputField(doc, config, pos_x, pos_y, text, columnText, rowText)
}

module.exports.generateScoreSheet = function (res, rounds) {
  let doc = new PDFDocument({autoFirstPage: false});

  doc.pipe(res);

  //doc.registerFont('Cardo', 'helper/NotoSans-Regular.ttf');
  //doc.font('Cardo');

  let posDatas = [];
  for (let i = 0; i < rounds.length; i++) {
    doc.addPage({margin: 10});
    posDatas.push(drawRun(doc, globalConfig, rounds[i]))
  }

  doc.end();

  //const util = require('util')
  //console.log(util.inspect(posDatas[0], {showHidden: false, depth: null}));
  return posDatas;
};