const cv = require('opencv4nodejs');

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

  drawPosdataToSheet(sheetProc, posData);

  cv.imwrite('helper/scoringSm.jpg', sheetProc);
};