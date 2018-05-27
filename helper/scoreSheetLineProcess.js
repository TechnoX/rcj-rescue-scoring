const cv = require('opencv4nodejs');
const jsQR = require('jsqr');
const util = require('util')

const InputTypeEnum = Object.freeze({POSMARK: "pos", CHECKBOX: "cb", TEXT: "txt", MATRIXROW: "mrow", MATRIX: "m", MATRIXTEXT: "mt", QR: "qr"});

function findPosdataByDescr(data, descriptor) {
  let dat = data.find(item => item.descr === descriptor);
  if (typeof dat === 'undefined') {
    return null;
  }
  return dat.posData;
}

function drawPosdataToSheet(sheetMat, posData, maxLevel) {
  if (maxLevel <= 0) {
    return;
  }

  sheetMat.drawRectangle(new cv.Rect(posData.x, posData.y, posData.w, posData.h), new cv.Vec3(0, 255, 0), 1, 8, 0);

  for (let i = 0; i < posData.children.length; i++) {
    drawPosdataToSheet(sheetMat, posData.children[i], maxLevel - 1)
  }
}


/**
 * processes a posdata checkbox element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns number that is proportional to the amount of grey in the checkbox area if element
 * is a checkbox, otherwise null
 */
function processPosdataCheckbox(mat, posdata) {
  if (posdata.type !== InputTypeEnum.CHECKBOX) {
    return null;
  }

  let matPosdata = mat.getRegion(new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h));

  let cumulative = 0;
  for (let y = 0; y < posdata.h; y++) {
    for (let x = 0; x < posdata.w; x++) {
      cumulative += (255 - matPosdata.at(y, x));
    }
  }
  return cumulative;
}


/**
 * processes a posdata matrixrow element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns index of the column with the highest value of grey if element
 * is a matrixrow, otherwise null
 */
function processPosdataMatrixrow(mat, posdata) {
  if (posdata.type !== InputTypeEnum.MATRIXROW) {
    return null;
  }

  let valMax = 0, iMax = 0;
  for (let i = 0; i < posdata.children.length; i++) {
    let val = processPosdataCheckbox(mat, posdata.children[i]);
    if (val > valMax) {
      valMax = val;
      iMax = i;
    }
  }
  return iMax;
}


/**
 * processes a posdata matrix element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns array of indexes of MATRIXROW if element is a matrix, otherwise null
 */
function processPosdataMatrix(mat, posdata) {
  if (posdata.type !== InputTypeEnum.MATRIX) {
    return null;
  }

  let rowCrossedIndexes = [];
  for (let i = 0; i < posdata.children.length; i++) {
    rowCrossedIndexes.push(processPosdataMatrixrow(mat, posdata.children[i]))
  }
  return rowCrossedIndexes;
}

/**
 * processes a posdata text element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns extracted mat region of the text field if element is a matrix, otherwise null
 */
function processPosdataText(mat, posdata) {
  if (posdata.type !== InputTypeEnum.TEXT) {
    return null;
  }

  return mat.getRegion(new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h)).getData();
}

/**
 * processes a posdata matrixtext element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns object of the shape {img, indexes} where img is the mat of the whole matrix and text
 * indexes is the return value of MATRIX if element is a matrixtext, otherwise null
 */
function processPosdataMatrixText(mat, posdata) {
  if (posdata.type !== InputTypeEnum.MATRIXTEXT) {
    return null;
  }

  return {
    img: mat.getRegion(new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h)).getData(),
    indexes: processPosdataMatrix(mat, posdata.children[1].posData)
  };
}

/**
 * processes a posdata qr element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns data of the qr code as string if element is a qr and a qr could be
 * detected, otherwise null
 */
function processPosdataQR(mat, posdata) {
  if (posdata.type !== InputTypeEnum.QR) {
    return null;
  }

  let code = jsQR(
    new Uint8ClampedArray(
      mat.getRegion(
        new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h)
      ).cvtColor(cv.COLOR_GRAY2BGRA).getData()
    ),
    posdata.w,
    posdata.h
  );
  if (code) {
    code = code.data
  }
  return code;
}

function processTileData(sheetMat, posdata) {
  let tiles = posdata.children.slice(0);

  for (let i = 0; i < tiles.length; i++) {
    for (let j = 0; j < tiles[i].children.length; j++) {
      tiles[i].children[j].cbVal = processPosdataCheckbox(sheetMat, tiles[i].children[j]);
    }
  }

  let procTiles = [];
  let max = Math.max.apply(Math, tiles.map(el => Math.max.apply(Math, el.children.map(t => t.cbVal))));
  for (let i = 0; i < tiles.length; i++) {
    procTiles.push([]);
    for (let j = 0; j < tiles[i].children.length; j++) {
      procTiles[i].push([]);
      procTiles[i][j].checked = tiles[i].children[j].cbVal > (max / 3);
    }
  }

  return {
    img: sheetMat.getRegion(new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h)).getData(),
    tiles: procTiles
  };
}

/**
 * Extracts position markers from the raw input image and scales the image in a way that
 * the posData pixel value from the sheet generation match the image
 * @param sheetMat raw sheet image
 * @param config configuration object from sheet generation
 * @param posMarkersPosData posData
 * @returns {Mat} normalized sheet
 */
function processPosMarkers(sheetMat, config, posMarkersPosData) {
  const params = new cv.SimpleBlobDetectorParams();
  params.filterByArea = false;
  params.filterByCircularity = true;
  params.minCircularity = 0.7; // Find Squares
  params.minCircularity = 0.8;
  params.filterByColor = false;
  params.filterByConvexity = false;
  params.filterByInertia = false;
  params.minThreshold = 10;
  params.thresholdStep = 4;
  params.maxThreshold = 200;

  const detector = new cv.SimpleBlobDetector(params);
  const allKeypoints = detector.detect(sheetMat.gaussianBlur(new cv.Size(5, 5), 0, 0, cv.BORDER_CONSTANT));
  const largestKeypoints = allKeypoints.sort((k1, k2) => k2.size - k1.size).slice(0, 3);

  const keyPointsSortX = largestKeypoints.slice(0).sort((k1, k2) => k2.point.x - k1.point.x);
  const keyPointsSortY = largestKeypoints.slice(0).sort((k1, k2) => k2.point.y - k1.point.y);

  return sheetMat.getRegion(
    new cv.Rect(
      keyPointsSortX[2].point.x,
      keyPointsSortY[2].point.y,
      keyPointsSortX[0].point.x - keyPointsSortX[2].point.x,
      keyPointsSortY[0].point.y - keyPointsSortY[2].point.y
    )
  ).resizeToMax(posMarkersPosData.h)
    .warpAffine(
      new cv.Mat([
          [1, 0, config.positionMarkers[0].x + config.positionMarkersSize / 2],
          [0, 1, config.positionMarkers[0].y + config.positionMarkersSize / 2]
        ], cv.CV_32FC1
      ), new cv.Size(posMarkersPosData.w + config.positionMarkers[0].x, posMarkersPosData.h + config.positionMarkers[0].y)
    );
}

module.exports.processScoreSheet = function(posData, config) {
  const normalizedSheet = processPosMarkers(cv.imread('helper/scoresheet_n.png').bgrToGray(), config, findPosdataByDescr(posData, 'posMarkers'));

  let sheetData = {};
  sheetData.qr = processPosdataQR(normalizedSheet, findPosdataByDescr(posData, 'meta'));
  sheetData.enterManually = processPosdataCheckbox(normalizedSheet, findPosdataByDescr(posData, 'enterManually'));
  sheetData.evacuation = processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'evacuation'));
  sheetData.checkpoints = [];
  for (let i = 0, posDataCB; (posDataCB = findPosdataByDescr(posData, 'cb' + i)) !== null; i++) {
    if (posDataCB === null) {
      break;
    }
    sheetData.checkpoints.push(processPosdataMatrixText(normalizedSheet, posDataCB))
  }
  sheetData.victimsAlive = processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'victimsAlive'));
  sheetData.victimsDead = processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'victimsDead'));
  sheetData.time = processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'time'));
  sheetData.signTeam = processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'signTeam'));
  sheetData.signRef = processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'signRef'));
  sheetData.tiles = processTileData(normalizedSheet, findPosdataByDescr(posData, 'field'));

  console.log(util.inspect(sheetData, {showHidden: false, depth: null}));

  let normalizedSheetColored = normalizedSheet.cvtColor(cv.COLOR_GRAY2BGR);
  drawPosdataToSheet(normalizedSheetColored, findPosdataByDescr(posData, 'field'), 3);
  cv.imwrite("helper/out.png", normalizedSheetColored)
};