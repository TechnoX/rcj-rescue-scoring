const PDFDocument = require('pdfkit');
const qr = require('qr-image');

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
  checkboxSize: 10,
  fields: {
    tileSize: 38,
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
        fontSize: 14,
        round: "Round",
        field: "Field",
        team: "Team",
        time: "Time:"
      }
    },
    inputs: {
      textFieldWidth: 65, // Width of field where human writes down number human readable
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
 * Defines four orientations
 * @type {Readonly<{RIGHT: number, BOTTOM: number, LEFT: number, TOP: number}>}
 */
const DirsEnum = Object.freeze({RIGHT: 1, BOTTOM: 2, LEFT: 3, TOP: 4});

const InputTypeEnum = Object.freeze({FIELD: "fld", FIELDTILE: "fldtl", POSMARK: "pos", CHECKBOX: "cb", TEXT: "txt", MATRIXROW: "mrow", MATRIX: "m", MATRIXTEXT: "mt", QR: "qr"});

/**
 * Draws a checkbox with text
 * @param doc The document to draw the checkbox in
 * @param pos_x absolute x-position
 * @param pos_y absolute y-position
 * @param size size of the checkbox
 * @param text text to be shown next to the checkbox (no text if empty string)
 * @param dir direction of the checkbox where the text should be shown
 * @param color
 */
function drawCheckbox(doc, pos_x, pos_y, size, text = "", dir = DirsEnum.RIGHT, color = "black", filled = false) {
  const posData = {type: InputTypeEnum.CHECKBOX, x: pos_x, y: pos_y, w: size, h: size, children: []};

  doc.save();
  doc.rect(pos_x, pos_y, size, size).lineWidth(1)
    .fillAndStroke(filled ? "black" : "white", color);

  if (text === "") {
    return {x: pos_x + size, y: pos_y + size, posData: posData}
  }

  var pos_x_end, pos_y_end;

  switch (dir) {
    case DirsEnum.RIGHT:
      pos_x = pos_x + size + 2;
      pos_y = pos_y + 1;
      pos_x_end = pos_x + size + doc.widthOfString(text);
      pos_y_end = pos_y + size;
      break;

    case DirsEnum.BOTTOM:
      pos_x = pos_x + 2;
      pos_y = pos_y + size + 2;
      pos_x_end = pos_x + size;
      pos_y_end = pos_y + Math.max(doc.widthOfString(text), size);
      break;

    case DirsEnum.LEFT:
      pos_x = pos_x - doc.widthOfString(text) - 2;
      pos_y = pos_y + 1;
      pos_x_end = pos_x + size;
      pos_y_end = pos_y + size;
      break;

    case DirsEnum.TOP:
      pos_x = pos_x + 2;
      pos_y = pos_y - size;
      pos_x_end = pos_x + Math.max(doc.widthOfString(text), size);
      pos_y_end = pos_y + size;
      break;
  }
  doc.rect(pos_x, pos_y, doc.widthOfString(text), size - 1)
    .fillOpacity(0.7)
    .lineWidth(0)
    .fillAndStroke("white", "white");

  doc.fontSize(size)
    .fillOpacity(1)
    .fillColor("black")
    .text(text, pos_x, pos_y);

  doc.restore();
  return {x: pos_x_end, y: pos_y_end, posData: posData}
}

function tileIsDroptile(tile) {
  return tile.tileType.intersections === 0
    && tile.tileType.gaps === 0
    && tile.items.speedbumps === 0
    && tile.items.obstacles === 0;
}

function drawMetadata(doc, pos_x, pos_y, config, round, field, team, time) {
  const posData = {type: InputTypeEnum.QR, x: pos_x, y: pos_y, w: config.data.metadata.sizeQR, h: config.data.metadata.sizeQR, children: []};

  doc.image(qr.imageSync(round._id.toString(), {margin: 0}), pos_x, pos_y, {width: config.data.metadata.sizeQR});
  pos_x += config.data.metadata.sizeQR + config.data.inputs.marginsVertical;

  doc.fontSize(config.data.metadata.text.fontSize);
  doc.fillColor("black");
  doc.text(config.data.metadata.text.round + " " + round.name, pos_x, pos_y);
  pos_y += config.data.metadata.text.fontSize + 1;
  doc.text(config.data.metadata.text.field + " " + field.name, pos_x, pos_y);
  pos_y += config.data.metadata.text.fontSize + 1;
  doc.text(config.data.metadata.text.team + " " + team.name, pos_x, pos_y);
  pos_y += config.data.metadata.text.fontSize + 1;
  let dateTime = new Date(time);
  doc.text(config.data.metadata.text.time + " " + dateTime.getHours() + ":" + dateTime.getMinutes(), pos_x, pos_y);
  pos_y += config.data.metadata.text.fontSize + 1;
  return {x: pos_x, y: pos_y, posData: posData}
}

function tileAddCheckbox(doc, posDataTile, config, text, color) {
  let checkbox_horizontal_amount = Math.floor((config.fields.tileSize - config.fields.checkbox.marginBorder * 2) / (config.checkboxSize * 2));
  let checkbox_vertical_amount = Math.floor((config.fields.tileSize - config.fields.checkbox.marginBorder * 2) / (config.checkboxSize + config.fields.checkbox.marginCheckbox));
  if (posDataTile.children.length === (checkbox_horizontal_amount * checkbox_vertical_amount)) {
    console.log("CANT PLACE ANY MORE CHECKBOXES!!!")
  }

  let checkbox_pos_x = posDataTile.x + config.fields.checkbox.marginBorder
      + Math.floor(posDataTile.children.length / checkbox_vertical_amount)
      * ((config.checkboxSize * 2) + config.fields.checkbox.marginCheckbox);
  let checkbox_pos_y = posDataTile.y + config.fields.checkbox.marginBorder
      + (posDataTile.children.length % checkbox_vertical_amount)
      * (config.checkboxSize + config.fields.checkbox.marginCheckbox);

  const posCheckbox = drawCheckbox(doc, checkbox_pos_x, checkbox_pos_y, config.checkboxSize, text, DirsEnum.RIGHT, color);
  posCheckbox.posData.id = text;
  posDataTile.children.push(posCheckbox.posData);
}

function dirToAngle(dir) {
  switch (dir) {
    case "bottom": return 0;
    case "right": return 90;
    case "top": return 180;
    case "left": return 270;
  }
  return 0;
}

function drawFields(doc, pos_x, pos_y, config, map) {
  const mapLevelHeight = map.width * (config.fields.tileSize + config.fields.tileSpacing) + 2 - config.fields.tileSpacing;
  const mapLevelWidth = map.length * (config.fields.tileSize + config.fields.tileSpacing) + 2 - config.fields.tileSpacing;

  const posData = {
    type: InputTypeEnum.FIELD,
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
      type: InputTypeEnum.FIELDTILE,
      x: tile_pos_x,
      y: tile_pos_y,
      w: config.fields.tileSize,
      h: config.fields.tileSize,
      children: []
    });

    if (tile.levelUp || tile.levelDown) {
      doc.save();

      doc.rotate(dirToAngle(tile.levelUp || tile.levelDown), {
        origin: [
          tile_pos_x + (config.fields.tileSize / 2),
          tile_pos_y + (config.fields.tileSize / 2)
        ]
      });
      doc.image("public/images/" + (tile.levelUp ? "up.png" : "down.png"),
        tile_pos_x + (config.fields.tileSize / 2),
        tile_pos_y + (config.fields.tileSize / 2), {width: config.fields.tileSize / 2});
      doc.restore()
    }

    if (map.startTile.x === tile.x && map.startTile.y === tile.y && map.startTile.z === tile.z) {
      tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "St", "green")
    } else if(tileIsDroptile(tile)) {
      tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "C", "blue")
    } else {
      for (let j = 0; tile.tileType.intersections > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "I", "red")
      }
      for (let j = 0; tile.items.speedbumps > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "S", "violet")
      }
      for (let j = 0; tile.items.obstacles > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "O", "brown")
      }
      for (let j = 0; tile.tileType.gaps > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, posData.children[posData.children.length - 1], config, "G", "orange")
      }
    }
  }

  return {
    x: pos_x + config.fields.positions[0].x + mapLevelWidth,
    y: pos_y + config.fields.positions[1].y + mapLevelHeight,
    posData: posData
  };
}

function drawCheckboxMatrix(doc, pos_x, pos_y, config, columnText, rowText) {
  doc.fontSize(config.checkboxSize);
  const rowTextWidth = Math.ceil(Math.max.apply(null, rowText.map(text => doc.widthOfString(text)))) + 2;

  const posData = {
    type: InputTypeEnum.MATRIX,
    x: pos_x,
    y: pos_y,
    w: rowTextWidth + 2 + rowText.length * config.checkboxSize,
    h: (columnText.length + 1) * config.checkboxSize,
    children: []
  };

  for (let rowIndex = 0; rowIndex < rowText.length; rowIndex++) {
    doc.fillColor("black")
      .text(rowText[rowIndex], pos_x, pos_y + rowIndex * config.checkboxSize);

    posData.children.push({
      type: InputTypeEnum.MATRIXROW,
      x: pos_x,
      y: pos_y + rowIndex * config.checkboxSize,
      w: rowText.length * config.checkboxSize,
      h: config.checkboxSize,
      children: []
    });

    for (let colIndex = 0; colIndex < columnText.length; colIndex++) {
      let posDatCheckbox = drawCheckbox(
        doc,
        pos_x + colIndex * config.checkboxSize + rowTextWidth,
        pos_y + rowIndex * config.checkboxSize,
        config.checkboxSize, rowIndex === 0 ? columnText[colIndex] : "", DirsEnum.TOP, "black"
      ).posData;
      posData.children[posData.children.length - 1].children.push(posDatCheckbox)
    }
  }

  return {x: pos_x + rowTextWidth + columnText.length * config.checkboxSize, y: pos_y + rowText.length * config.checkboxSize, posData: posData}
}

function drawTextInputField(doc, config, pos_x, pos_y, text, width, height) {
  const posData = {
    type: InputTypeEnum.TEXT,
    x: pos_x,
    y: pos_y,
    w: width,
    h: height + config.data.inputs.labelFontSize,
    children: []
  };

  doc.fontSize(config.data.inputs.labelFontSize)
    .fillColor("black")
    .text(text, pos_x, pos_y);
  pos_y += config.data.inputs.labelFontSize;

  doc.rect(pos_x, pos_y, width, height)
    .fillAndStroke("white", "black");
  pos_x += width;
  pos_y += height;
  return {x: pos_x, y: pos_y, posData: posData}
}

function drawNumberInputField(doc, config, pos_x, pos_y, text, columnText, rowText) {
  const posText = drawTextInputField(doc, config, pos_x, pos_y, text, config.data.inputs.textFieldWidth, (rowText.length + 1) * config.checkboxSize);
  posText.x += 2;
  posText.y -= rowText.length * config.checkboxSize;
  const posMatrix = drawCheckboxMatrix(doc, posText.x, posText.y, config, columnText, rowText);

  return {
    x: posMatrix.x,
    y: posMatrix.y,
    posData: {
      type: InputTypeEnum.MATRIXTEXT,
      x: pos_x,
      y: pos_y,
      w: posMatrix.x - pos_x,
      h: posMatrix.y - pos_y,
      children: [posText, posMatrix]
    }
  };
}

function drawLOPInputField(doc, config, pos_x, pos_y, text) {
  const columnText = ["0", "1", "2", "3+"];
  const rowText = [""];
  return drawNumberInputField(doc, config, pos_x, pos_y, text, columnText, rowText)
}

function drawTimeInputField(doc, config, pos_x, pos_y) {
  const columnText = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const rowText = ["Min", "Sec", "Sec"];
  return drawNumberInputField(doc, config, pos_x, pos_y, "Time:", columnText, rowText)
}

function drawVictimInputField(doc, config, pos_x, pos_y, amount, text) {
  let columnText = [];
  for (let i = 0; i <= amount; i++) {
    columnText.push("" + i)
  }
  let rowText = [""];
  return drawNumberInputField(doc, config, pos_x, pos_y, "Victims (" + text + "):", columnText, rowText)
}

function drawEvacuationInputField(doc, config, pos_x, pos_y) {
  const columnText = ["L", "H"];
  const rowText = [""];
  return drawNumberInputField(doc, config, pos_x, pos_y, "Evacuation Low/High:", columnText, rowText)
}

function drawPositionMarkers(doc, config) {
  const pos_x_min = Math.min.apply(null, config.positionMarkers.map(el => el.x));
  const pos_y_min = Math.min.apply(null, config.positionMarkers.map(el => el.y));
  const pos_x_max = Math.max.apply(null, config.positionMarkers.map(el => el.x));
  const pos_y_max = Math.max.apply(null, config.positionMarkers.map(el => el.y));

  const posData = {
    type: InputTypeEnum.POSMARK,
    x: pos_x_min,
    y: pos_y_min,
    w: pos_x_max - pos_x_min,
    h: pos_y_max - pos_y_min,
    children: []
  };
  for (let i = 0; i < config.positionMarkers.length; i++) {
    const posDataMark = {
      type: InputTypeEnum.POSMARK,
      x: config.positionMarkers[i].x,
      y: config.positionMarkers[i].y,
      w: config.positionMarkersSize,
      h: config.positionMarkersSize,
      children: []
    };

    doc.rect(
      posDataMark.x,
      posDataMark.y,
      posDataMark.w,
      posDataMark.h
    ).lineWidth(1).fillAndStroke("black", "white");

    posData.children.push(posDataMark);
  }
  return {
    x: pos_x_max + config.positionMarkersSize,
    y: pos_y_max + config.positionMarkersSize,
    posData: posData
  };
}

function drawRun(doc, config, round, field, team, time, map) {
  let posDatas = [];
  let pos_y = config.margin.top;
  let pos_x = config.margin.left;

  function savePos(pos, descr) {
    posDatas.push({descr: descr, posData: pos.posData});
  }

  function nextItem(pos, descr) {
    savePos(pos, descr);
    pos_y = pos.y + config.data.inputs.marginsVertical;
  }

  savePos(drawPositionMarkers(doc, config), "posMarkers");
  let pf = drawFields(doc, pos_x, pos_y, config, map);
  savePos(pf, "field");
  pos_x += config.data.marginLeft;
  nextItem(drawMetadata(doc, pos_x, pos_y, config, round, field, team, time), "meta");
  nextItem(drawCheckbox(doc, pos_x, pos_y, config.checkboxSize, "Enter scoring sheet manually", DirsEnum.RIGHT, "black"), "enterManually");
  nextItem(drawEvacuationInputField(doc, config, pos_x, pos_y), "evacuation");

  if (map.numberOfDropTiles > 0) {
    for (let i = 0; i < map.numberOfDropTiles; i++) {
      nextItem(drawLOPInputField(doc, config, pos_x, pos_y, (i === 0 ? "Start" : ("CP " + i)) + " to CP " + (i + 1) + ":"), "cb" + i);
    }
  }

  nextItem(drawVictimInputField(doc, config, pos_x, pos_y, 9, "alive"), "victimsAlive");
  nextItem(drawVictimInputField(doc, config, pos_x, pos_y, 9, "dead"), "victimsDead");
  nextItem(drawTimeInputField(doc, config, pos_x, pos_y), "time");
  nextItem(drawTextInputField(doc, config, pos_x, pos_y, "Team:", config.signature.width, config.signature.height), "signTeam");
  nextItem(drawTextInputField(doc, config, pos_x, pos_y, "Referee:", config.signature.width, config.signature.height), "signRef");

  return posDatas
}

module.exports.generateScoreSheet = function(res, rounds) {
  let doc = new PDFDocument({autoFirstPage: false});

  doc.pipe(res);

  let posDatas = [];
  for (let i = 0; i < rounds.length; i++) {
    doc.addPage({margin: 10});
    posDatas.push(drawRun(doc, globalConfig, rounds[i].round, rounds[i].field, rounds[i].team, rounds[i].startTime, rounds[i].map))
  }

  doc.end();

  //const util = require('util')
  //console.log(util.inspect(posDatas[0], {showHidden: false, depth: null}));
  return posDatas;
};