const cv = require('opencv4nodejs');
const proc = require('./scoreSheetProcessUtil');

module.exports.processScoreSheet = function (posData, scoreSheetFileName) {
  const processedPosMarkers = proc.processPosMarkers(cv.imread(scoreSheetFileName).bgrToGray(), proc.findPosdataByDescr(posData, 'posMarkers'));
  const normalizedSheet = processedPosMarkers.normalizedMat;

  /*proc.drawPosdataToSheet(normalizedSheet, proc.findPosdataByDescr(posData, 'field'), 4);
  proc.drawPosdataToSheet(normalizedSheet, proc.findPosdataByDescr(posData, 'time'), 4);
  proc.drawPosdataToSheet(normalizedSheet, proc.findPosdataByDescr(posData, 'lops'), 4);
  proc.drawPosdataToSheet(normalizedSheet, proc.findPosdataByDescr(posData, 'exitBonus'), 4);*/

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