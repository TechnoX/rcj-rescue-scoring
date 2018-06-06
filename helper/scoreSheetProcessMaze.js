const cv = require('opencv4nodejs');
const proc = require('./scoreSheetProcessUtil');

module.exports.processScoreSheet = function (posData, scoreSheetFileName) {
  const normalizedSheet = proc.processPosMarkers(cv.imread(scoreSheetFileName).bgrToGray(), proc.findPosdataByDescr(posData, 'posMarkers'));

  let sheetData = {};
  sheetData.qr = proc.processPosdataQR(normalizedSheet, proc.findPosdataByDescr(posData, 'meta'));
  sheetData.enterManually = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'enterManually'));
  sheetData.lops = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'lops'));
  sheetData.time = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'time'));
  sheetData.signTeam = proc.processPosdataText(normalizedSheet, proc.findPosdataByDescr(posData, 'signTeam'));
  sheetData.signRef = proc.processPosdataText(normalizedSheet, proc.findPosdataByDescr(posData, 'signRef'));
  sheetData.exitBonus = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'exitBonus'));
  sheetData.tiles = proc.processFieldData(normalizedSheet, proc.findPosdataByDescr(posData, 'field'));

  return sheetData;
};