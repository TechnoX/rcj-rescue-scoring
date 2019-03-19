const cv = require('opencv4nodejs');
const proc = require('./scoreSheetProcessUtil');

module.exports.processScoreSheet = function (posDataRaw, scoreSheetFileName) {
  const posData = JSON.parse(JSON.stringify(posDataRaw)); // Deep copy
  for (let i = 0; i < posData.length; i++) {
    // The input posData has a small resolution of less than 10px per checkbox, while the
    // input image has a much higher resolution that would be good to use. So we scale the
    // posData elements.
    proc.scalePosData(posData[i].posData, 2);
  }


  const mat = cv.imread(scoreSheetFileName).bgrToGray();
  mat.drawRectangle(new cv.Rect(900, 220, 100, 100), new cv.Vec3(255, 255, 255), 200, 4, 0);

  const processedPosMarkers = proc.processPosMarkers(mat, proc.findPosdataByDescr(posData, 'posMarkers'));

  //const processedPosMarkers = proc.processPosMarkers(cv.imread(scoreSheetFileName).bgrToGray(), proc.findPosdataByDescr(posData, 'posMarkers'));
  const normalizedSheet = processedPosMarkers.normalizedMat;

  let sheetData = {};
  sheetData.rawSheet = processedPosMarkers.img;
  sheetData.qr = proc.processPosdataQR(normalizedSheet, proc.findPosdataByDescr(posData, 'meta'));
  sheetData.enterManually = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'enterManually'));
  sheetData.lops = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'lops'));
  sheetData.time = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'time'));
  sheetData.signTeam = proc.processPosdataText(normalizedSheet, proc.findPosdataByDescr(posData, 'signTeam'));
  sheetData.signRef = proc.processPosdataText(normalizedSheet, proc.findPosdataByDescr(posData, 'signRef'));
  sheetData.exitBonus = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'exitBonus'));
  sheetData.hasComment = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'comment'));
  sheetData.acceptResult = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'acceptResult'));
  sheetData.tiles = proc.processFieldData(normalizedSheet, proc.findPosdataByDescr(posData, 'field'));

  return sheetData;
};