const cv = require('opencv4nodejs');
const proc = require('./scoreSheetProcessUtil');

module.exports.processScoreSheet = function (posData, scoreSheetFileName) {
  const normalizedSheet = proc.processPosMarkers(cv.imread(scoreSheetFileName).bgrToGray(), proc.findPosdataByDescr(posData, 'posMarkers'));

  let sheetData = {};
  sheetData.qr = proc.processPosdataQR(normalizedSheet, proc.findPosdataByDescr(posData, 'meta'));
  sheetData.enterManually = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'enterManually'));
  sheetData.evacuation = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'evacuation'));
  sheetData.checkpoints = [];
  //console.log(posData);
  for (let i = 0, posDataCB; (posDataCB = proc.findPosdataByDescr(posData, 'cb' + i)) !== null; i++) {
    if (posDataCB === null) {
      break;
    }
    sheetData.checkpoints.push(proc.processPosdataMatrixText(normalizedSheet, posDataCB))
  }
  sheetData.victimsAlive = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'victimsAlive'));
  sheetData.victimsDeadBeforeAlive = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'victimsDeadBeforeAlive'));
  sheetData.victimsDeadAfterAlive = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'victimsDeadAfterAlive'));
  sheetData.time = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'time'));
  sheetData.signTeam = proc.processPosdataText(normalizedSheet, proc.findPosdataByDescr(posData, 'signTeam'));
  sheetData.signRef = proc.processPosdataText(normalizedSheet, proc.findPosdataByDescr(posData, 'signRef'));
  sheetData.exitBonus = proc.processPosdataMatrixText(normalizedSheet, proc.findPosdataByDescr(posData, 'exitBonus'));
  sheetData.tiles = proc.processFieldData(normalizedSheet, proc.findPosdataByDescr(posData, 'field'));

  return sheetData;
};