const qr = require('qr-image');
const defs = require('./scoreSheetUtil');

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
module.exports.drawCheckbox = function (doc, pos_x, pos_y, size, text = "", dir = defs.DirsEnum.RIGHT, color = "black", filled = false) {
  const posData = {type: defs.InputTypeEnum.CHECKBOX, x: pos_x, y: pos_y, w: size, h: size, children: []};

  doc.save();
  doc.rect(pos_x, pos_y, size, size).lineWidth(1)
    .fillAndStroke(filled ? "black" : "white", color);

  if (text === "") {
    return {x: pos_x + size, y: pos_y + size, posData: posData}
  }

  var pos_x_end, pos_y_end;

  switch (dir) {
    case defs.DirsEnum.RIGHT:
      pos_x = pos_x + size + 2;
      pos_y = pos_y + 1;
      pos_x_end = pos_x + size + doc.widthOfString(text);
      pos_y_end = pos_y + size;
      break;

    case defs.DirsEnum.BOTTOM:
      pos_x = pos_x + 2;
      pos_y = pos_y + size + 2;
      pos_x_end = pos_x + size;
      pos_y_end = pos_y + Math.max(doc.widthOfString(text), size);
      break;

    case defs.DirsEnum.LEFT:
      pos_x = pos_x - doc.widthOfString(text) - 2;
      pos_y = pos_y + 1;
      pos_x_end = pos_x + size;
      pos_y_end = pos_y + size;
      break;

    case defs.DirsEnum.TOP:
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
};

module.exports.drawMetadata = function (doc, pos_x, pos_y, config, run) {
  const posData = {
    type: defs.InputTypeEnum.QR,
    x: pos_x,
    y: pos_y,
    w: config.data.metadata.sizeQR,
    h: config.data.metadata.sizeQR,
    children: []
  };

  doc.image(qr.imageSync(run._id.toString(), {margin: 0}), pos_x, pos_y, {width: config.data.metadata.sizeQR});
  pos_x += config.data.metadata.sizeQR + config.data.inputs.marginsVertical;

  doc.fontSize(config.data.metadata.text.fontSize);
  doc.fillColor("black");
  doc.text("Round " + run.round.name, pos_x, pos_y);
  pos_y += config.data.metadata.text.fontSize + 1;
  doc.text("Field " + run.field.name, pos_x, pos_y);
  pos_y += config.data.metadata.text.fontSize + 1;
  doc.text("Team " + run.team.name, pos_x, pos_y);
  pos_y += config.data.metadata.text.fontSize + 1;
  let dateTime = new Date(run.startTime);
  doc.text("Time: " + dateTime.getHours() + ":" + dateTime.getMinutes(), pos_x, pos_y);
  pos_y += config.data.metadata.text.fontSize + 1;
  return {x: pos_x, y: pos_y, posData: posData}
};

module.exports.tileAddCheckbox = function (doc, posDataTile, config, text, scoringID, color, index) {
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

  const posCheckbox = this.drawCheckbox(doc, checkbox_pos_x, checkbox_pos_y, config.checkboxSize, text, defs.DirsEnum.RIGHT, color);
  posCheckbox.posData.meta = {
    id: scoringID,
    tileIndex: index
  };
  posDataTile.children.push(posCheckbox.posData);
};

module.exports.drawCheckboxMatrix = function (doc, pos_x, pos_y, config, columnText, rowText) {
  doc.fontSize(config.checkboxSize);
  const rowTextWidth = Math.ceil(Math.max.apply(null, rowText.map(text => doc.widthOfString(text)))) + 2;

  const posData = {
    type: defs.InputTypeEnum.MATRIX,
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
      type: defs.InputTypeEnum.MATRIXROW,
      x: pos_x,
      y: pos_y + rowIndex * config.checkboxSize,
      w: rowText.length * config.checkboxSize,
      h: config.checkboxSize,
      children: []
    });

    for (let colIndex = 0; colIndex < columnText.length; colIndex++) {
      let posDatCheckbox = this.drawCheckbox(
        doc,
        pos_x + colIndex * config.checkboxSize + rowTextWidth,
        pos_y + rowIndex * config.checkboxSize,
        config.checkboxSize, rowIndex === 0 ? columnText[colIndex] : "", defs.DirsEnum.TOP, "black"
      ).posData;
      posData.children[posData.children.length - 1].children.push(posDatCheckbox)
    }
  }

  return {
    x: pos_x + rowTextWidth + columnText.length * config.checkboxSize,
    y: pos_y + rowText.length * config.checkboxSize,
    posData: posData
  }
};

module.exports.drawTextInputField = function (doc, config, pos_x, pos_y, text, width, height) {
  const posData = {
    type: defs.InputTypeEnum.TEXT,
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
};

module.exports.drawNumberInputField = function (doc, config, pos_x, pos_y, text, columnText, rowText) {
  const posText = this.drawTextInputField(doc, config, pos_x, pos_y, text, config.data.inputs.textFieldWidth, (rowText.length + 1) * config.checkboxSize);
  posText.x += 2;
  posText.y -= rowText.length * config.checkboxSize;
  const posMatrix = this.drawCheckboxMatrix(doc, posText.x, posText.y, config, columnText, rowText);

  return {
    x: posMatrix.x,
    y: posMatrix.y,
    posData: {
      type: defs.InputTypeEnum.MATRIXTEXT,
      x: pos_x,
      y: pos_y,
      w: posMatrix.x - pos_x,
      h: posMatrix.y - pos_y,
      children: [posText, posMatrix]
    }
  };
};

module.exports.drawLOPInputField = function (doc, config, pos_x, pos_y, text) {
  const columnText = ["0", "1", "2", "3", "4", "5", "6", "7", "8+"];
  const rowText = [""];
  return this.drawNumberInputField(doc, config, pos_x, pos_y, text, columnText, rowText)
};

module.exports.drawTimeInputField = function (doc, config, pos_x, pos_y) {
  const columnText = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const rowText = ["Min", "Sec", "Sec"];
  return this.drawNumberInputField(doc, config, pos_x, pos_y, "Time:", columnText, rowText)
};

module.exports.drawExitBonusField = function (doc, config, pos_x, pos_y) {
  const columnText = ["Y", "N"];
  const rowText = [""];
  return this.drawNumberInputField(doc, config, pos_x, pos_y, "Exit Bonus (Yes/No):", columnText, rowText)
};

module.exports.drawVictimInputField = function (doc, config, pos_x, pos_y, amount, text) {
  let columnText = [];
  for (let i = 0; i <= amount; i++) {
    columnText.push("" + i)
  }
  let rowText = [""];
  return this.drawNumberInputField(doc, config, pos_x, pos_y, "Victims (" + text + "):", columnText, rowText)
};

module.exports.drawEvacuationInputField = function (doc, config, pos_x, pos_y) {
  const columnText = ["L", "H"];
  const rowText = [""];
  return this.drawNumberInputField(doc, config, pos_x, pos_y, "Evacuation Low/High:", columnText, rowText)
};

module.exports.drawPositionMarkers = function (doc, config) {
  const pos_x_min = Math.min.apply(null, config.positionMarkers.map(el => el.x));
  const pos_y_min = Math.min.apply(null, config.positionMarkers.map(el => el.y));
  const pos_x_max = Math.max.apply(null, config.positionMarkers.map(el => el.x));
  const pos_y_max = Math.max.apply(null, config.positionMarkers.map(el => el.y));

  const posData = {
    type: defs.InputTypeEnum.POSMARK,
    x: pos_x_min,
    y: pos_y_min,
    w: pos_x_max - pos_x_min,
    h: pos_y_max - pos_y_min,
    children: []
  };
  for (let i = 0; i < config.positionMarkers.length; i++) {
    const posDataMark = {
      type: defs.InputTypeEnum.POSMARK,
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
};