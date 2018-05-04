var PDFDocument = require('pdfkit');
var qr = require('qr-image');

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
      marginQR: 10,
      text: {
        fontSize: 14,
        round: "Round",
        field: "Field",
        team: "Team",
        time: "Time:"
      }
    },
    inputs: {
      labelFontSize: 14,
      marginsVertical: 10 // Vertical space between two input fields
    }
  },
  signatures: {

  }
}

var DirsEnum = Object.freeze({RIGHT: 1, BOTTOM: 2, LEFT: 3, TOP: 4})

function drawCheckbox(doc, pos, size, text, dir, color) {
  doc.save()
  doc.rect(pos.x, pos.y, size, size)
    .strokeColor(color)
    .lineWidth(1)
    .fillAndStroke("white", color)

  if (text == "") {
    return;
  }

  doc.fontSize(size)
  doc.fillAndStroke("black", "black")
  switch (dir) {
    case DirsEnum.RIGHT:  doc.text(text, pos.x + size + 2, pos.y + 1); break;
    case DirsEnum.BOTTOM: doc.text(text, pos.x + 2, pos.y + size + 2); break;
    case DirsEnum.LEFT:   doc.text(text, pos.x - doc.widthOfString(text) - 2, pos.y + 1); break;
    case DirsEnum.TOP:    doc.text(text, pos.x + 2, pos.y - size); break;
  }
  doc.restore()
}

function tileIsDroptile(tile) {
  return tile.tileType.intersections == 0
    && tile.tileType.gaps == 0
    && tile.items.speedbumps == 0
    && tile.items.obstacles == 0;
}

function drawMetadata(doc, pos, config, round, field, team, time) {
  var pos_x_save = pos.x

  doc.image(qr.imageSync(round._id.toString(), {margin: 0}), pos.x, pos.y, {width: config.data.metadata.sizeQR})
  pos.x += config.data.metadata.sizeQR + config.data.metadata.marginQR

  doc.fontSize(config.data.metadata.text.fontSize)
  doc.fillColor("black")
  doc.text(config.data.metadata.text.round + " " + round.name, pos.x, pos.y)
  pos.y += config.data.metadata.text.fontSize + 1
  doc.text(config.data.metadata.text.field + " " + field.name, pos.x, pos.y)
  pos.y += config.data.metadata.text.fontSize + 1
  doc.text(config.data.metadata.text.team + " " + team.name, pos.x, pos.y)
  pos.y += config.data.metadata.text.fontSize + 1
  doc.text(config.data.metadata.text.time + " ", pos.x, pos.y)
  pos.x = pos_x_save
}

function tileAddCheckbox(doc, checkboxes, pos, config, text, color) {
  var checkbox_horizontal_amount = Math.floor((config.fields.tileSize - config.fields.checkbox.marginBorder * 2) / (config.checkboxSize * 2))
  var checkbox_vertical_amount = Math.floor((config.fields.tileSize - config.fields.checkbox.marginBorder * 2) / (config.checkboxSize + config.fields.checkbox.marginCheckbox))
  if (checkboxes[checkboxes.length - 1].length == (checkbox_horizontal_amount * checkbox_vertical_amount)) {
    console.log("CANT PLACE ANY MORE CHECKBOXES!!!")
  }

  var checkbox_pos = {
    x: pos.x + config.fields.checkbox.marginBorder
      + Math.floor(checkboxes[checkboxes.length - 1].length / checkbox_vertical_amount)
      * ((config.checkboxSize * 2) + config.fields.checkbox.marginCheckbox),
    y: pos.y + config.fields.checkbox.marginBorder
      + (checkboxes[checkboxes.length - 1].length % checkbox_vertical_amount)
      * (config.checkboxSize + config.fields.checkbox.marginCheckbox)
  }
  drawCheckbox(doc, checkbox_pos, config.checkboxSize, text, DirsEnum.RIGHT, color)
  checkboxes[checkboxes.length - 1].push({type: text, pos: checkbox_pos})
}

function drawFields(doc, pos, config, map) {
  for (var z = 0; z < map.height && z < config.fields.positions.length; z++) {
    doc.lineWidth(1)
      .rect(
        pos.x + config.fields.positions[z].x,
        pos.y + config.fields.positions[z].y,
        map.width * (config.fields.tileSize + config.fields.tileSpacing) + 2 - config.fields.tileSpacing,
        map.length * (config.fields.tileSize + config.fields.tileSpacing) + 2 - config.fields.tileSpacing
      )
      .fillAndStroke("#EFEFEF", "black")
  }

  pos.x++
  pos.y++

  var checkboxes = []

  for (var i = 0; i < map.tiles.length; i++) {
    var tile = map.tiles[i]
    if (tile.z >= config.fields.positions.length) {
      console.log("Warning: Score sheet can't handle enough line levels!")
      continue // Skip levels that have no position data
    }

    var tile_pos = {
      x: pos.x + config.fields.positions[tile.z].x + tile.x * (config.fields.tileSize + config.fields.tileSpacing),
      y: pos.y + config.fields.positions[tile.z].y + tile.y * (config.fields.tileSize + config.fields.tileSpacing)
    }

    doc.save()
    doc.rotate(tile.rot, {
      origin: [
        tile_pos.x + (config.fields.tileSize / 2),
        tile_pos.y + (config.fields.tileSize / 2)
      ]
    })
    doc.image("public/images/tiles/" + tile.tileType.image,
      tile_pos.x,
      tile_pos.y, {width: config.fields.tileSize})
    doc.restore()

    checkboxes.push([])

    if (map.startTile.x == tile.x && map.startTile.y == tile.y && map.startTile.z == tile.z) {
      tileAddCheckbox(doc, checkboxes, tile_pos, config, "Start", "green")
    } else if(tileIsDroptile(tile)) {
      tileAddCheckbox(doc, checkboxes, tile_pos, config, "C", "blue")
    } else {
      for (var j = 0; tile.tileType.intersections > 0 && j < tile.index.length; j++) {
        tileAddCheckbox(doc, checkboxes, tile_pos, config, "I", "red")
      }
      if (tile.items.speedbumps > 0) {
        tileAddCheckbox(doc, checkboxes, tile_pos, config, "S", "violet")
      }
      if (tile.items.obstacles > 0) {
        tileAddCheckbox(doc, checkboxes, tile_pos, config, "O", "brown")
      }
      if (tile.tileType.gaps > 0) {
        tileAddCheckbox(doc, checkboxes, tile_pos, config, "G", "orange")
      }
    }
  }
}

function drawCheckboxMatrix(doc, pos, config, columnText, rowText) {
  doc.fontSize(config.checkboxSize)
  var rowTextWidth = Math.max.apply(null, rowText.map(text => doc.widthOfString(text))) + 2
  for (var rowIndex = 0; rowIndex < rowText.length; rowIndex++) {
    doc.fillColor("black")
      .text(rowText[rowIndex], pos.x, pos.y + rowIndex * config.checkboxSize)

    for (var colIndex = 0; colIndex < columnText.length; colIndex++) {
      drawCheckbox(
        doc,
        {
          x: pos.x + colIndex * config.checkboxSize + rowTextWidth,
          y: pos.y + rowIndex * config.checkboxSize
        },
        config.checkboxSize, rowIndex == 0 ? columnText[colIndex] : "", DirsEnum.TOP, "black"
      )
    }
  }
}

function drawInputField(doc, config, pos, text, columnText, rowText) {
  var pos_x_save = pos.x
  doc.fontSize(config.data.inputs.labelFontSize)
    .fillColor("black")
    .text(text, pos.x, pos.y)
  pos.y += config.data.inputs.labelFontSize

  doc.fillAndStroke("white", "black")
    .rect(pos.x, pos.y, 60, (rowText.length + 1) * config.checkboxSize)
  pos.x += 60 + 2
  pos.y += config.checkboxSize
  drawCheckboxMatrix(doc, pos, config, columnText, rowText)
  pos.x = pos_x_save
}

function drawLOPInputFields(doc, config, pos, map) {
  drawLOPInputField(doc, config, {x: pos.x, y: pos.y}, "Start to " + (map.numberOfDropTiles == 0 ? "Evacuation:" : "CP 1:"))
  for (var i = 1; i <= map.numberOfDropTiles; i++) {
    pos.y += (config.data.inputs.labelFontSize + config.checkboxSize * 2 + config.data.inputs.marginsVertical)
    if(i == map.numberOfDropTiles) {
      drawLOPInputField(doc, config, {x: pos.x, y: pos.y}, "CP " + i + " to Evacuation:")
    } else {
      drawLOPInputField(doc, config, {x: pos.x, y: pos.y}, "CP " + i + " to CP " + (i + 1) + ":")
    }
  }
}

function drawLOPInputField(doc, config, pos, text) {
  var columnText = ["0", "1", "2", "3+"]
  var rowText = [""]
  drawInputField(doc, config, pos, text, columnText, rowText)
}

function drawTimeInputField(doc, config, pos) {
  var columnText = ["0", "1", "2", "3", "4", "5", "6", "7", "8"]
  var rowText = ["Minutes", "Seconds", "Seconds"]
  drawInputField(doc, config, pos, "Time:", columnText, rowText)
}

function drawEvacuationManualCheckboxes(doc, config, pos) {
  drawCheckbox(doc, pos, config.checkboxSize, "Low Evacuation", DirsEnum.RIGHT, "black")
  pos.y += config.checkboxSize + config.data.inputs.marginsVertical
  drawCheckbox(doc, pos, config.checkboxSize, "High Evacuation", DirsEnum.RIGHT, "black")
  pos.y += config.checkboxSize + config.data.inputs.marginsVertical
  drawCheckbox(doc, pos, config.checkboxSize, "Enter manually", DirsEnum.RIGHT, "black")
  pos.y += config.checkboxSize + config.data.inputs.marginsVertical
}

function drawVictimInputField(doc, config, pos, amount, text) {
  var columnText = []
  for (var i = 0; i <= amount; i++) {
    columnText.push("" + i)
  }
  var rowText = [""]
  drawInputField(doc, config, pos, "Victims (" + text + "):", columnText, rowText)
}

function drawRun(doc, config, round, field, team, time, map) {
  var pos = {
    x: config.margin.left,
    y: config.margin.top
  }

  drawFields(doc, pos, config, map)
  pos.x += config.data.marginLeft

  drawMetadata(doc, pos, config, round, field, team, time)
  pos.y += config.data.metadata.sizeQR + config.data.inputs.marginsVertical

  drawEvacuationManualCheckboxes(doc, config, pos)
  pos.y += config.data.inputs.marginsVertical

  drawLOPInputFields(doc, config, pos, map)
  pos.x = config.margin.left + config.data.marginLeft
  pos.y += config.data.inputs.marginsVertical + 40

  drawVictimInputField(doc, config, pos, 9, "alive")
  pos.x = config.margin.left + config.data.marginLeft
  pos.y += config.data.inputs.marginsVertical
  drawVictimInputField(doc, config, pos, 9, "dead")
  pos.x = config.margin.left + config.data.marginLeft
  pos.y += config.data.inputs.marginsVertical

  drawTimeInputField(doc, config, pos)
}

module.exports.generateScoreSheet = function(res, rounds) {
  var doc = new PDFDocument({autoFirstPage: false})

  doc.pipe(res);

  for (var i = 0; i < rounds.length; i++) {
    doc.addPage({margin: 10})
    drawRun(doc, globalConfig, rounds[i].round, rounds[i].field, rounds[i].team, rounds[i].startTime, rounds[i].map)
  }

  doc.end()
}