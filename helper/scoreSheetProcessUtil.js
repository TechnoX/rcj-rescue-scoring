const cv = require('opencv4nodejs');
const jsQR = require('jsqr');
const defs = require('./scoreSheetUtil');

module.exports.drawPosdataToSheet = function (sheetMat, posData, maxLevel) {
  if (maxLevel <= 0) {
    return;
  }

  if (typeof posData.posData !== 'undefined') {
    posData = posData.posData;
  }

  sheetMat.drawRectangle(new cv.Rect(posData.x, posData.y, posData.w, posData.h), new cv.Vec3(0, 255, 0), 1, 8, 0);

  for (let i = 0; i < posData.children.length; i++) {
    this.drawPosdataToSheet(sheetMat, posData.children[i], maxLevel - 1)
  }
};


/**
 * processes a posdata checkbox element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns null if element is not a checkbox
 * otherwise a value between 0 and 255 depending on the blackness of the checkbox.
 * If pixels in the middle of the checkbox are marked black it counts higher than
 * on the border.
 */
module.exports.processPosdataCheckbox = function (mat, posdata) {
  if (posdata.type !== defs.InputTypeEnum.CHECKBOX) {
    return null;
  }

  let matPosdata = mat.getRegion(new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h));

  let cumulative = 0;
  let cnt = 0;
  for (let y = posdata.h / 3; y < (posdata.h / 3) * 2; y++) {
    for (let x = posdata.w / 3; x < (posdata.w / 3) * 2; x++) {
      // Have different factors - if the checkbox is black in the middle it counts more than on the
      // border. The distribution looks basically like this:
      // 1 2 1 depending on the size of the box it adapts
      // 2 3 2
      // 1 2 1
      let facY = posdata.h / 2 - Math.abs(y - posdata.h / 2);
      let facX = posdata.w / 2 - Math.abs(x - posdata.w / 2);
      let fac = ((facY * facX) + 1);
      cumulative += fac * (255 - matPosdata.at(y, x));
      cnt += fac;
    }
  }
  cumulative /= cnt;

  return Math.round(cumulative);
};


/**
 * processes a posdata matrixrow element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns index of the column with the highest value of grey if element
 * is a matrixrow, otherwise null
 */
module.exports.processPosdataMatrixrow = function (mat, posdata) {
  if (posdata.type !== defs.InputTypeEnum.MATRIXROW) {
    return null;
  }

  let valMax = 0, iMax = 0;
  for (let i = 0; i < posdata.children.length; i++) {
    let val = this.processPosdataCheckbox(mat, posdata.children[i]);
    if (val > valMax) {
      valMax = val;
      iMax = i;
    }
  }
  return iMax;
};


/**
 * processes a posdata matrix element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns array of indexes of MATRIXROW if element is a matrix, otherwise null
 */
module.exports.processPosdataMatrix = function (mat, posdata) {
  if (posdata.type !== defs.InputTypeEnum.MATRIX) {
    return null;
  }

  let rowCrossedIndexes = [];
  for (let i = 0; i < posdata.children.length; i++) {
    rowCrossedIndexes.push(this.processPosdataMatrixrow(mat, posdata.children[i]))
  }
  return rowCrossedIndexes;
};

/**
 * processes a posdata text element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns extracted mat region of the text field if element is a matrix, otherwise null
 */
module.exports.processPosdataText = function (mat, posdata) {
  if (posdata.type !== defs.InputTypeEnum.TEXT) {
    return null;
  }

  return {
    data: cv.imencode(
      ".jpg",
      mat.getRegion(new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h))
    ),
    contentType: "image/jpg"
  };
};

/**
 * processes a posdata matrixtext element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns object of the shape {img, indexes} where img is the mat of the whole matrix and text
 * indexes is the return value of MATRIX if element is a matrixtext, otherwise null
 */
module.exports.processPosdataMatrixText = function (mat, posdata) {
  if (posdata.type !== defs.InputTypeEnum.MATRIXTEXT) {
    return null;
  }

  return {
    img: {
      data: cv.imencode(
        ".jpg",
        mat.getRegion(new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h))
      ),
      contentType: "image/jpg"
    },
    indexes: this.processPosdataMatrix(mat, posdata.children[1].posData)
  };
};

/**
 * processes a posdata qr element on the normalized mat
 * @param mat normalized mat
 * @param posdata posdata for the element to process
 * @returns data of the qr code as string if element is a qr and a qr could be
 * detected, otherwise null
 */
module.exports.processPosdataQR = function (mat, posdata) {
  if (posdata.type !== defs.InputTypeEnum.QR) {
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
};

module.exports.processPosdataQRFull = function (filename) {
  let mat = cv.imread(filename).bgrToGray().resizeToMax(1000);
  let code = jsQR(
    new Uint8ClampedArray(mat.cvtColor(cv.COLOR_GRAY2BGRA).getData()),
    mat.cols,
    mat.rows
  );
  if (code) {
    code = code.data
  }
  return code;
};

/**
 * Extracts position markers from the raw input image and scales the image in a way that
 * the posData pixel value from the sheet generation match the image
 * @param sheetMat raw sheet image
 * @param posMarkersPosData posData
 * @returns {Mat} normalized sheet
 */
module.exports.processPosMarkers = function (sheetMat, posMarkersPosData) {
  const params = new cv.SimpleBlobDetectorParams();
  params.filterByArea = false;
  params.filterByCircularity = true;
  params.minCircularity = 0.7; // Find Squares
  params.minCircularity = 0.8;
  params.filterByColor = true;
  params.blobColor = 0;
  params.filterByConvexity = false;
  params.filterByInertia = false;
  params.minThreshold = 10;
  params.thresholdStep = 4;
  params.maxThreshold = 200;

  const detector = new cv.SimpleBlobDetector(params);
  const allKeypoints = detector.detect(sheetMat.gaussianBlur(new cv.Size(15, 15), 0, 0, cv.BORDER_CONSTANT));
  const largestKeypoints = allKeypoints.sort((k1, k2) => k2.size - k1.size).slice(0, 4);

  const keyPointsSortY = largestKeypoints.slice(0).sort((k1, k2) => k2.point.y - k1.point.y);
  const keyPointsSortXR = keyPointsSortY.slice(0, 2).sort((k1, k2) => k2.point.x - k1.point.x);
  const keyPointsSortXL = keyPointsSortY.slice(2, 4).sort((k1, k2) => k2.point.x - k1.point.x);

  const sourcePoints = [
    keyPointsSortXL[1].point, // Upper left
    keyPointsSortXR[1].point, // Lower left
    keyPointsSortXR[0].point, // Lower right
    keyPointsSortXL[0].point // Upper right
  ];
  const offset_x = posMarkersPosData.children[0].w / 2;
  const offset_y = posMarkersPosData.children[0].h / 2;
  const destinationPoints = [
    new cv.Point2( // Upper left
      posMarkersPosData.children[0].x + offset_x,
      posMarkersPosData.children[0].y + offset_y
    ), new cv.Point2( // Lower left
      posMarkersPosData.children[0].x + offset_x,
      posMarkersPosData.children[0].y + posMarkersPosData.h + offset_y
    ), new cv.Point2( // Lower right
      posMarkersPosData.children[0].x + posMarkersPosData.w + offset_x,
      posMarkersPosData.children[0].y + posMarkersPosData.h + offset_y
    ), new cv.Point2( // Upper right
      posMarkersPosData.children[0].x + posMarkersPosData.w + offset_x,
      posMarkersPosData.children[0].y + offset_y
    )
  ];

  const normalizedMat = sheetMat.warpPerspective(
    cv.getPerspectiveTransform(sourcePoints, destinationPoints),
    new cv.Size(
      posMarkersPosData.w + posMarkersPosData.children[0].x,
      posMarkersPosData.h + posMarkersPosData.children[0].y
    )
  );

  return {
    normalizedMat: normalizedMat,//.adaptiveThreshold(255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 15),
    img: {
      data: cv.imencode(".jpg", normalizedMat),
      contentType: "image/jpg"
    }
  }
};

module.exports.processFieldData = function (sheetMat, posdata) {
  let tiles = posdata.children.slice(0);

  for (let i = 0; i < tiles.length; i++) {
    for (let j = 0; j < tiles[i].children.length; j++) {
      tiles[i].children[j].cbVal = this.processPosdataCheckbox(sheetMat, tiles[i].children[j]);
    }
  }

  let procTiles = [];
  for (let i = 0; i < tiles.length; i++) {
    procTiles.push([]);
    for (let j = 0; j < tiles[i].children.length; j++) {
      procTiles[i].push([]);
      procTiles[i][j].meta = tiles[i].children[j].meta;
      procTiles[i][j].checked = tiles[i].children[j].cbVal > 100;
    }
  }

  return {
    img: {
      data: cv.imencode(
        ".jpg",
        sheetMat.getRegion(new cv.Rect(posdata.x, posdata.y, posdata.w, posdata.h))
      ),
      contentType: "image/jpg"
    },
    tilesData: procTiles
  };
};

module.exports.findPosdataByDescr = function (data, descriptor) {
  let dat = data.find(item => item.descr === descriptor);
  if (typeof dat === 'undefined') {
    return null;
  }
  return dat.posData;
};

module.exports.scalePosData = function(posData, fac) {
  if (typeof posData.posData !== 'undefined') {
    posData = posData.posData;
  }

  posData.w *= fac;
  posData.h *= fac;
  posData.x *= fac;
  posData.y *= fac;

  for (let i = 0; i < posData.children.length; i++) {
    this.scalePosData(posData.children[i], fac)
  }
};