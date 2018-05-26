const cv = require('opencv4nodejs');
const jsQR = require('jsqr');

const InputTypeEnum = Object.freeze({POSMARK: "pos", CHECKBOX: "cb", TEXT: "txt", MATRIXROW: "mrow", MATRIX: "m", MATRIXTEXT: "mt", QR: "qr"});

function findPosdataByDescr(data, descriptor) {
  return data.find(item => item.descr === descriptor).posData;
}

function drawPosdataToSheet(sheetMat, posData) {
  for (let i = 0; i < posData.data.length; i++) {
    let man = posData.data[i].posData;
    sheetMat.drawRectangle(new cv.Rect(man.x - 40, man.y - 80, man.w, man.h),
      new cv.Vec3(0, 255, 0), 2, 4, 0);
  }


  for (let i = 0; i < posData.tiles.length; i++) {
    for (let j = 0; j < posData.tiles[i].length; j++) {
      let man = posData.tiles[i][j].posData;
      sheetMat.drawRectangle(new cv.Rect(man.x - 40, man.y - 80, man.w, man.h),
        new cv.Vec3(0, 255, 0), 2, 4, 0);
    }
  }
}

/**
 * processes a posdata element on the calibrated mat
 * @param mat calibrated mat
 * @param posdata posdata for the mat
 * @returns depends on the type of the given posData:
 *    POSMARK: undefined
 *    CHECKBOX: number that is proportional to the amount of grey in the checkbox area.
 *    MATRIXROW: index of the column with the highest value of grey
 *    MATRIX: array of indexes of MATRIXROW
 *    TEXT: mat of the text field
 *    MATRIXTEXT: object of the shape {img, indexes} where img is the mat of
 *      the whole matrix and text, indexes is the return value of MATRIX
 *    QR: null if no QR code could be identified, otherwise the data of the code as string
 */
function processPosdataElement(mat, posdata) {
  let matPosdata = mat.getRegion(new cv.Rect(posdata.x - 40, posdata.y - 80, posdata.w, posdata.h));

  switch (posdata.type) {
    case InputTypeEnum.POSMARK:
      break;

    case InputTypeEnum.CHECKBOX:
      let cumulative = 0;
      for (let y = 0; y < posdata.h; y++) {
        for (let x = 0; x < posdata.w; x++) {
          cumulative += (255 - matPosdata.at(y, x));
        }
      }
      return cumulative;

    case InputTypeEnum.MATRIXROW:
      let valMax = 0, iMax = 0;
      for (let i = 0; i < posdata.children.length; i++) {
        let val = processPosdataElement(mat, posdata.children[i]);
        if (val > valMax) {
          valMax = val;
          iMax = i;
        }
      }
      return iMax;

    case InputTypeEnum.MATRIX:
      let rowCrossedIndexes = [];
      for (let i = 0; i < posdata.children.length; i++) {
        rowCrossedIndexes.push(processPosdataElement(mat, posdata.children[i]))
      }
      return rowCrossedIndexes;

    case InputTypeEnum.TEXT:
      return matPosdata;

    case InputTypeEnum.MATRIXTEXT:
      return {
        img: matPosdata,
        indexes: processPosdataElement(mat, posdata.children[1].posData)
      };

    case InputTypeEnum.QR:
      let code = jsQR(new Uint8ClampedArray(matPosdata.cvtColor(cv.COLOR_GRAY2BGRA).getData()), posdata.w, posdata.h);
      if (code) {
        code = code.data
      }
      return code;
  }
}

module.exports.processScoreSheet = function(posData, config) {
  const params = new cv.SimpleBlobDetectorParams();
  params.filterByArea = false;
  params.filterByCircularity = true;
  params.minCircularity = 0.7; // Squares
  params.minCircularity = 0.8;
  params.filterByColor = false;
  params.filterByConvexity = false;
  params.filterByInertia = false;
  params.minThreshold = 10;
  params.thresholdStep = 4;
  params.maxThreshold = 200;

  const detector = new cv.SimpleBlobDetector(params);
  const sheet = cv.imread('helper/scoresheet_new.png').bgrToGray();
  const allKeypoints = detector.detect(sheet.gaussianBlur(new cv.Size(5, 5), 0, 0, cv.BORDER_CONSTANT));
  const largestKeypoints = allKeypoints.sort((k1, k2) => k2.size - k1.size).slice(0, 3);

  const posMarkers = findPosdataByDescr(posData.data, 'posMarkers');

  const keyPointsSortX = largestKeypoints.slice(0).sort((k1, k2) => k2.point.x - k1.point.x);
  const keyPointsSortY = largestKeypoints.slice(0).sort((k1, k2) => k2.point.y - k1.point.y);

  const sheetProc = sheet.getRegion(
    new cv.Rect(
      keyPointsSortX[2].point.x,
      keyPointsSortY[2].point.y,
      keyPointsSortX[0].point.x - keyPointsSortX[2].point.x,
      keyPointsSortY[0].point.y - keyPointsSortY[2].point.y
    )
  ).resizeToMax(Math.max(posMarkers.w, posMarkers.h));

  console.log(processPosdataElement(sheetProc, findPosdataByDescr(posData.data, 'meta')));
  console.log(processPosdataElement(sheetProc, findPosdataByDescr(posData.data, 'enterManually')))
};