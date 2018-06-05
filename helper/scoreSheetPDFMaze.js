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
    tileSize: 40,
    wallTickness: 4, // Should be even
    checkbox: {
      marginBorder: 1,
      marginCheckbox: 2
    },
    tileSpacing: 2, // Spacing between tiles
    positions: [ // Position for each z level. The scoring sheet can handle up to n levels.
      {x: 0, y: 0}, // Level 0
      {x: 0, y: 390} // Level 1
    ]
  },
  data: {
    marginLeft: 400, // Distance from config.margin.left to text
    metadata: {
      sizeQR: 57,
      text: {
        fontSize: 11
      }
    },
    inputs: {
      textFieldWidth: 60, // Width of field where human writes down number human readable
      labelFontSize: 12,
      marginsVertical: 8 // Vertical space between two input fields
    }
  },
  signature: {
    width: 150,
    height: 30
  }
};

function drawLoPInputField(doc, config, pos_x, pos_y) {
  const columnText = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const rowText = ["", ""];
  return pdf.drawNumberInputField(doc, config, pos_x, pos_y, "LOPs:", columnText, rowText)
};

function drawFields(doc, pos_x, pos_y, config, map) {
  const mapLevelHeight = map.width * config.fields.tileSize;
  const mapLevelWidth = map.length * config.fields.tileSize;

  const posData = {
    type: defs.InputTypeEnum.FIELD,
    x: pos_x + config.fields.positions[0].x,
    y: pos_y + config.fields.positions[0].y,
    w: config.fields.positions[1].x + mapLevelWidth,
    h: config.fields.positions[1].y + mapLevelHeight,
    children: []
  };

  doc.lineWidth(0);

  // Draw walls first, otherwise they might overlap with checkboxes
  for (let i = 0, cell; cell = map.cells[i]; i++) {
    if (cell.isWall) {
      if (cell.x % 2 === 0) {
        // Horizontal wall
        doc.rect(
          pos_x + (cell.x / 2) * config.fields.tileSize,
          pos_y + ((cell.y - 1) / 2) * config.fields.tileSize + config.fields.wallTickness / 2,
          config.fields.wallTickness,
          config.fields.tileSize
        ).fillAndStroke("#000000", "black")
      } else {
        // Vertical wall
        doc.rect(
          pos_x + ((cell.x - 1) / 2) * config.fields.tileSize + config.fields.wallTickness / 2,
          pos_y + (cell.y / 2) * config.fields.tileSize,
          config.fields.tileSize,
          config.fields.wallTickness
        ).fillAndStroke("#000000", "black")
      }
    }
  }

  // Now draw the tile content
  for (let i = 0, cell; cell = map.cells[i]; i++) {
    if (!cell.isWall) {
      const tile_pos_x = pos_x + config.fields.positions[cell.z].x + ((cell.x - 1) / 2) * config.fields.tileSize + config.fields.wallTickness / 2;
      const tile_pos_y = pos_y + config.fields.positions[cell.z].y + ((cell.y - 1) / 2) * config.fields.tileSize + config.fields.wallTickness / 2;

      posData.children.push({
        type: defs.InputTypeEnum.FIELDTILE,
        x: tile_pos_x,
        y: tile_pos_y,
        w: config.fields.tileSize,
        h: config.fields.tileSize,
        children: []
      });

      if (cell.isTile) {
        if (cell.tile.checkpoint) {
          doc.rect(
            tile_pos_x + 2,
            tile_pos_y + 2,
            config.fields.tileSize - config.fields.wallTickness / 2 - 2,
            config.fields.tileSize - config.fields.wallTickness / 2 - 2
          ).fillAndStroke("#a8a8a8", "black");

          pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "C", "checkpoint", "#0080FF", 0);
        } else if (cell.tile.black) {
          doc.rect(
            tile_pos_x + 2,
            tile_pos_y + 2,
            config.fields.tileSize - config.fields.wallTickness / 2 - 2,
            config.fields.tileSize - config.fields.wallTickness / 2 - 2
          ).fillAndStroke("#272727", "black");
        }

        if (cell.tile.speedbump) {
          pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "B", "speedbump", "#046D0E", 0);
        }

        if (cell.tile.rampBottom) {
          pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "R", "rampBot", "#EB39E8", 0);
        } else if (cell.tile.rampTop) {
          pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "R", "rampTop", "#EB39E8", 0);
        }

        function addVictim(victimDir) {
          switch (victimDir) {
            case "Heated":
              pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "V", "victimHeated", "#eb9000", 0);
              pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "VK", "victimHeatedKit", "#eb9000", 0);
              break;

            case "H":
              pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "H", "victimH", "#eb0200", 0);
              for (let i = 0; i < 2; i++) {
                pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "HK", "victimHKit", "#eb0200", 0);
              }
              break;

            case "S":
              pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "S", "victimS", "#eb0047", 0);
              pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "SK", "victimSKit", "#eb0047", 0);
              break;

            case "U":
              pdf.tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "U", "victimU", "#77eb00", 0);
              break;
          }
        }

        addVictim(cell.tile.victims.top);
        addVictim(cell.tile.victims.right);
        addVictim(cell.tile.victims.bottom);
        addVictim(cell.tile.victims.left);
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

  savePos(pdf.drawPositionMarkers(doc, config), "posMarkers");
  let pf = drawFields(doc, pos_x, pos_y, config, scoringRun.map);
  savePos(pf, "field");
  pos_x += config.data.marginLeft;
  nextItem(pdf.drawMetadata(doc, pos_x, pos_y, config, scoringRun), "meta");
  nextItem(pdf.drawCheckbox(doc, pos_x, pos_y, config.checkboxSize, "Enter scoring sheet manually", defs.DirsEnum.RIGHT, "black"), "enterManually");


  nextItem(drawLoPInputField(doc, config, pos_x, pos_y), "lops");
  nextItem(pdf.drawExitBonusField(doc, config, pos_x, pos_y), "exitBonus");
  nextItem(pdf.drawTimeInputField(doc, config, pos_x, pos_y), "time");
  nextItem(pdf.drawTextInputField(doc, config, pos_x, pos_y, "Team:", config.signature.width, config.signature.height), "signTeam");
  nextItem(pdf.drawTextInputField(doc, config, pos_x, pos_y, "Referee:", config.signature.width, config.signature.height), "signRef");
  return posDatas
}

module.exports.generateScoreSheet = function (res, rounds) {
  let doc = new PDFDocument({autoFirstPage: false});

  doc.pipe(res);

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