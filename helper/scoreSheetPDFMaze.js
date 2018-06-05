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
    wallTickness: 4, // Should be even
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

function drawFields(doc, pos_x, pos_y, config, map) {
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

  doc.lineWidth(0);

  for (let i = 0, cell; cell = map.cells[i]; i++) {
    if (cell.isWall) {
      if (cell.x % 2 === 0) {
        // Horizontal wall
        doc.rect(
            pos_x + (cell.x / 2) * config.fields.tileSize,
            pos_y + ((cell.y - 1) / 2) * config.fields.tileSize + config.fields.wallTickness / 2,
            config.fields.wallTickness,
            config.fields.tileSize
          ).fillAndStroke("black", "black")
      } else {
        // Vertical wall
        doc.rect(
          pos_x + ((cell.x - 1) / 2) * config.fields.tileSize + config.fields.wallTickness / 2,
          pos_y + (cell.y / 2) * config.fields.tileSize,
          config.fields.tileSize,
          config.fields.wallTickness
        ).fillAndStroke("black", "black")
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