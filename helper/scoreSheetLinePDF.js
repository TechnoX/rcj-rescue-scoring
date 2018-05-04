var PDFDocument = require('pdfkit');
var qr = require('qr-image');

const globalConfig = {
  margin: {
    left: 25,
    top: 25
  },
  header: {
    height: 40, // General height of header line
    title: {
      fontSize: 20,
      text: "RoboCup Junior Rescue Line Scoring Sheet",
      width: 300 // Width of textbox.
    },
    information: {
      marginQR: 20,
      fontSize: 14,
      text: {
        round: "Round",
        field: "Field",
        team: "Team"
      }
    }
  },
  fields: {
    marginHeader: 10,
    tileSize: 32,
    checkbox: {
      size: 7,
      marginBorder: 1,
      marginCheckbox: 2
    },
    tileSpacing: 2, // Spacing between tiles
    positions: [ // Position for each z level. The scoring sheet can handle up to n levels.
      {x: 0, y: 0}, // Level 0
      {x: 280, y: 0} // Level 1
    ]
  }
}

function drawCheckbox(doc, posX, posY, size, text, color) {
  doc.rect(posX, posY, size, size)
    .strokeColor(color)
    .lineWidth(1)
    .fillAndStroke("white", color)

  doc.fontSize(size)
  doc.fillAndStroke("black", "black")
    .text(text, posX + size + 2, posY + 1)
    .highlight(posX + size + 2, posY, doc.widthOfString(text), size)
}

function tileIsDroptile(tile) {
  return tile.tileType.intersections == 0
    && tile.tileType.gaps == 0
    && tile.items.speedbumps == 0
    && tile.items.obstacles == 0;
}

function drawHeader(doc, pos, config, round, field, team) {
  doc.fontSize(config.header.title.fontSize)
  doc.text(config.header.title.text, pos.x, pos.y, {width: config.header.title.width})
  pos.x += config.header.title.width

  doc.image(qr.imageSync(round._id.toString(), {margin: 0}), pos.x, pos.y, {width: config.header.height})
  pos.x += config.header.height + config.header.information.marginQR

  doc.fontSize(config.header.information.fontSize)
  doc.text(config.header.information.text.round + ": " + round.name, pos.x, pos.y)
  pos.y += config.header.information.fontSize + 1
  doc.text(config.header.information.text.field + ": " + field.name, pos.x, pos.y)
  pos.y += config.header.information.fontSize + 1
  doc.text(config.header.information.text.team + ": " + team.name, pos.x, pos.y)
}

function tileAddCheckbox(doc, checkboxes, pos, config, text, color) {
  var checkbox_horizontal_amount = Math.floor((config.fields.tileSize - config.fields.checkbox.marginBorder * 2) / (config.fields.checkbox.size * 2))
  var checkbox_vertical_amount = Math.floor((config.fields.tileSize - config.fields.checkbox.marginBorder * 2) / (config.fields.checkbox.size + config.fields.checkbox.marginCheckbox))
  console.log(checkbox_horizontal_amount, checkbox_vertical_amount)
  if (checkboxes[checkboxes.length - 1].length == (checkbox_horizontal_amount * checkbox_vertical_amount)) {
    console.log("CANT PLACE ANY MORE CHECKBOXES!!!")
  }

  var checkbox_pos_x = pos.x + config.fields.checkbox.marginBorder + Math.floor(checkboxes[checkboxes.length - 1].length / checkbox_vertical_amount) * ((config.fields.checkbox.size * 2) + config.fields.checkbox.marginCheckbox)
  var checkbox_pos_y = pos.y + config.fields.checkbox.marginBorder + (checkboxes[checkboxes.length - 1].length % checkbox_vertical_amount) * (config.fields.checkbox.size + config.fields.checkbox.marginCheckbox)
  drawCheckbox(doc, checkbox_pos_x, checkbox_pos_y, config.fields.checkbox.size, text, color)
  checkboxes[checkboxes.length - 1].push({type: text, x: checkbox_pos_x, y: checkbox_pos_y})
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

function drawRun(doc, config, round, field, team, map) {
  drawHeader(
    doc,
    {
      x: config.margin.left,
      y: config.margin.top
    },
    config,
    round,
    field,
    team
  )
  drawFields(
    doc,
    {
      x: config.margin.left,
      y: config.margin.top + config.header.height + config.fields.marginHeader
    },
    config,
    map
  )
}

module.exports.generateScoreSheet = function(res, rounds) {
  var doc = new PDFDocument({autoFirstPage: false})

  doc.pipe(res);

  for(var i = 0; i < rounds.length; i++) {
    doc.addPage()
    drawRun(doc, globalConfig, rounds[i].round, rounds[i].field, rounds[i].team, rounds[i].map)
  }

  doc.end()
}