const cv = require('opencv4nodejs');
const proc = require('./scoreSheetProcessUtil');

function processTileData(sheetMat, posdata) {
  let tiles = posdata.children.slice(0);

  for (let i = 0; i < tiles.length; i++) {
    for (let j = 0; j < tiles[i].children.length; j++) {
      tiles[i].children[j].cbVal = proc.processPosdataCheckbox(sheetMat, tiles[i].children[j]);
    }
  }

  let procTiles = [];
  let max = Math.max.apply(Math, tiles.map(el => Math.max.apply(Math, el.children.map(t => t.cbVal))));
  for (let i = 0; i < tiles.length; i++) {
    procTiles.push([]);
    for (let j = 0; j < tiles[i].children.length; j++) {
      procTiles[i].push([]);
      procTiles[i][j].meta = tiles[i].children[j].meta;
      procTiles[i][j].checked = tiles[i].children[j].cbVal > (max / 3);
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
}

function findPosdataByDescr(data, descriptor) {
  let dat = data.find(item => item.descr === descriptor);
  if (typeof dat === 'undefined') {
    return null;
  }
  return dat.posData;
};

module.exports.processScoreSheet = function (posData, scoreSheetFileName) {
  const normalizedSheet = proc.processPosMarkers(cv.imread(scoreSheetFileName).bgrToGray(), findPosdataByDescr(posData, 'posMarkers'));

  let sheetData = {};
  sheetData.qr = proc.processPosdataQR(normalizedSheet, findPosdataByDescr(posData, 'meta'));
  sheetData.enterManually = proc.processPosdataCheckbox(normalizedSheet, findPosdataByDescr(posData, 'enterManually')) > 10000;
  sheetData.evacuation = proc.processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'evacuation'));
  sheetData.checkpoints = [];
  //console.log(posData);
  for (let i = 0, posDataCB; (posDataCB = findPosdataByDescr(posData, 'cb' + i)) !== null; i++) {
    if (posDataCB === null) {
      break;
    }
    sheetData.checkpoints.push(proc.processPosdataMatrixText(normalizedSheet, posDataCB))
  }
  sheetData.victimsAlive = proc.processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'victimsAlive'));
  sheetData.victimsDeadBeforeAlive = proc.processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'victimsDeadBeforeAlive'));
  sheetData.victimsDeadAfterAlive = proc.processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'victimsDeadAfterAlive'));
  sheetData.time = proc.processPosdataMatrixText(normalizedSheet, findPosdataByDescr(posData, 'time'));
  sheetData.signTeam = proc.processPosdataText(normalizedSheet, findPosdataByDescr(posData, 'signTeam'));
  sheetData.signRef = proc.processPosdataText(normalizedSheet, findPosdataByDescr(posData, 'signRef'));
  sheetData.exitBonus = proc.processPosdataCheckbox(normalizedSheet, findPosdataByDescr(posData, 'exitBonus'));
  sheetData.tiles = processTileData(normalizedSheet, findPosdataByDescr(posData, 'field'));

  return sheetData;
};