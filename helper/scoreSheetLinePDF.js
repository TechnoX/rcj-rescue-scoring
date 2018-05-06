const PDFDocument = require('pdfkit');
const qr = require('qr-image');

/**
 * Defines some important numbers for the placement of different objects in the scoresheet.
 */
const globalConfig = {
  margin: {
    left: 40,
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
function drawCheckbox(doc, pos_x, pos_y, size, text, dir, color) {
  doc.save();
  doc.rect(pos_x, pos_y, size, size).lineWidth(1)
    .fillAndStroke("white", color);

  if (text === "") {
    return {x: pos_x + size, y: pos_y + size}
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
  return {x: pos_x_end, y: pos_y_end}
}

function tileIsDroptile(tile) {
  return tile.tileType.intersections === 0
    && tile.tileType.gaps === 0
    && tile.items.speedbumps === 0
    && tile.items.obstacles === 0;
}

function drawMetadata(doc, pos_x, pos_y, config, round, field, team, time) {
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
  return {x: pos_x, y: pos_y}
}

function tileAddCheckbox(doc, checkboxes, pos_x, pos_y, config, text, color) {
  let checkbox_horizontal_amount = Math.floor((config.fields.tileSize - config.fields.checkbox.marginBorder * 2) / (config.checkboxSize * 2));
  let checkbox_vertical_amount = Math.floor((config.fields.tileSize - config.fields.checkbox.marginBorder * 2) / (config.checkboxSize + config.fields.checkbox.marginCheckbox));
  if (checkboxes[checkboxes.length - 1].length === (checkbox_horizontal_amount * checkbox_vertical_amount)) {
    console.log("CANT PLACE ANY MORE CHECKBOXES!!!")
  }

  let checkbox_pos_x = pos_x + config.fields.checkbox.marginBorder
      + Math.floor(checkboxes[checkboxes.length - 1].length / checkbox_vertical_amount)
      * ((config.checkboxSize * 2) + config.fields.checkbox.marginCheckbox);
  let checkbox_pos_y = pos_y + config.fields.checkbox.marginBorder
      + (checkboxes[checkboxes.length - 1].length % checkbox_vertical_amount)
      * (config.checkboxSize + config.fields.checkbox.marginCheckbox);

  checkboxes[checkboxes.length - 1].push({type: text, pos: {x: checkbox_pos_x, y: checkbox_pos_y}});
  return drawCheckbox(doc, checkbox_pos_x, checkbox_pos_y, config.checkboxSize, text, DirsEnum.RIGHT, color)
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
  for (let z = 0; z < map.height && z < config.fields.positions.length; z++) {
    doc.lineWidth(1)
      .rect(
        pos_x + config.fields.positions[z].x,
        pos_y + config.fields.positions[z].y,
        map.width * (config.fields.tileSize + config.fields.tileSpacing) + 2 - config.fields.tileSpacing,
        map.length * (config.fields.tileSize + config.fields.tileSpacing) + 2 - config.fields.tileSpacing
      )
      .fillAndStroke("#EFEFEF", "black")
  }

  pos_x++;
  pos_y++;

  let checkboxes = [];

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

    checkboxes.push([]);

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
      tileAddCheckbox(doc, checkboxes, tile_pos_x, tile_pos_y, config, "St", "green")
    } else if(tileIsDroptile(tile)) {
      tileAddCheckbox(doc, checkboxes, tile_pos_x, tile_pos_y, config, "C", "blue")
    } else {
      for (let j = 0; tile.tileType.intersections > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, checkboxes, tile_pos_x, tile_pos_y, config, "I", "red")
      }
      for (let j = 0; tile.items.speedbumps > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, checkboxes, tile_pos_x, tile_pos_y, config, "S", "violet")
      }
      for (let j = 0; tile.items.obstacles > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, checkboxes, tile_pos_x, tile_pos_y, config, "O", "brown")
      }
      for (let j = 0; tile.tileType.gaps > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, checkboxes, tile_pos_x, tile_pos_y, config, "G", "orange")
      }
    }
  }
}

function drawCheckboxMatrix(doc, pos_x, pos_y, config, columnText, rowText) {
  doc.fontSize(config.checkboxSize);
  const rowTextWidth = Math.max.apply(null, rowText.map(text => doc.widthOfString(text))) + 2;
  for (let rowIndex = 0; rowIndex < rowText.length; rowIndex++) {
    doc.fillColor("black")
      .text(rowText[rowIndex], pos_x, pos_y + rowIndex * config.checkboxSize);

    for (let colIndex = 0; colIndex < columnText.length; colIndex++) {
      drawCheckbox(
        doc,
        pos_x + colIndex * config.checkboxSize + rowTextWidth,
        pos_y + rowIndex * config.checkboxSize,
        config.checkboxSize, rowIndex === 0 ? columnText[colIndex] : "", DirsEnum.TOP, "black"
      )
    }
  }
  return {x: pos_x + rowTextWidth + columnText.length * config.checkboxSize, y: pos_y + rowText.length * config.checkboxSize}
}

function drawTextInputField(doc, config, pos_x, pos_y, text, width, height) {
  doc.fontSize(config.data.inputs.labelFontSize)
    .fillColor("black")
    .text(text, pos_x, pos_y);
  pos_y += config.data.inputs.labelFontSize;

  doc.rect(pos_x, pos_y, width, height)
    .fillAndStroke("white", "black");
  pos_x += width;
  pos_y += height;
  return {x: pos_x, y: pos_y}
}

function drawNumberInputField(doc, config, pos_x, pos_y, text, columnText, rowText) {
  const pos = drawTextInputField(doc, config, pos_x, pos_y, text, config.data.inputs.textFieldWidth, (rowText.length + 1) * config.checkboxSize);
  pos.x += 2;
  pos.y -= rowText.length * config.checkboxSize;
  return drawCheckboxMatrix(doc, pos.x, pos.y, config, columnText, rowText)
}

function drawLOPInputField(doc, config, pos_x, pos_y, text) {
  const columnText = ["0", "1", "2", "3+"];
  const rowText = [""];
  return drawNumberInputField(doc, config, pos_x, pos_y, text, columnText, rowText)
}

function drawTimeInputField(doc, config, pos_x, pos_y) {
  const columnText = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
  const rowText = ["Minutes", "Seconds", "Seconds"];
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

function drawRun(doc, config, round, field, team, time, map) {
  let pos_y = config.margin.top;
  let pos_x = config.margin.left;
  drawFields(doc, pos_x, pos_y, config, map);
  pos_x += config.data.marginLeft;
  pos_y = drawMetadata(doc, pos_x, pos_y, config, round, field, team, time).y + config.data.inputs.marginsVertical;
  pos_y = drawCheckbox(doc, pos_x, pos_y, config.checkboxSize, "Low Evacuation", DirsEnum.RIGHT, "black").y + config.data.inputs.marginsVertical;
  pos_y = drawCheckbox(doc, pos_x, pos_y, config.checkboxSize, "High Evacuation", DirsEnum.RIGHT, "black").y + config.data.inputs.marginsVertical;
  pos_y = drawCheckbox(doc, pos_x, pos_y, config.checkboxSize, "Enter scoring sheet manually", DirsEnum.RIGHT, "black").y + config.data.inputs.marginsVertical;

  if (map.numberOfDropTiles > 0) {
    for (let i = 0; i < map.numberOfDropTiles; i++) {
      pos_y = drawLOPInputField(doc, config, pos_x, pos_y, (i === 0 ? "Start" : ("CP " + i)) + " to CP " + (i + 1) + ":").y + config.data.inputs.marginsVertical
    }
  }

  pos_y = drawVictimInputField(doc, config, pos_x, pos_y, 9, "alive").y + config.data.inputs.marginsVertical;
  pos_y = drawVictimInputField(doc, config, pos_x, pos_y, 9, "dead").y + config.data.inputs.marginsVertical;
  pos_y = drawTimeInputField(doc, config, pos_x, pos_y).y + config.data.inputs.marginsVertical;
  pos_y = drawTextInputField(doc, config, pos_x, pos_y, "Team:", config.signature.width, config.signature.height).y + config.data.inputs.marginsVertical;
  pos_y = drawTextInputField(doc, config, pos_x, pos_y, "Referee:", config.signature.width, config.signature.height).y + config.data.inputs.marginsVertical;
  drawTextInputField(doc, config, pos_x, pos_y, "Co-Referee:", config.signature.width, config.signature.height)
}

module.exports.generateScoreSheet = function(res, rounds) {
  let doc = new PDFDocument({autoFirstPage: false});

  doc.pipe(res);

  for (let i = 0; i < rounds.length; i++) {
    doc.addPage({margin: 10});
    drawRun(doc, globalConfig, rounds[i].round, rounds[i].field, rounds[i].team, rounds[i].startTime, rounds[i].map)
  }

  doc.end()
};