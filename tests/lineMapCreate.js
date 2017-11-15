const lineMapdb = require('../leagues/line/lineMap')

new lineMapdb.lineMap({
  competition      : "59759831aa67ba5178a2751e",
  name             : "Test2",
  height           : 1,
  width            : 2,
  length           : 3,
  tiles            : [{
    x       : 1,
    y       : 1,
    z       : 1,
    rot     : 0,
    items   : {
      obstacles : 2,
      speedbumps: 3
    },
    tileType: "570c27c3f5a9dabe23f3af90"
  },
    {
      x       : 2,
      y       : 1,
      z       : 1,
      rot     : 0,
      items   : {
        obstacles : 2,
        speedbumps: 3
      },
      tileType: "570c27c3f5a9dabe23f3af90"
    },
    {
      x       : 3,
      y       : 1,
      z       : 1,
      rot     : 0,
      items   : {
        obstacles : 1,
        speedbumps: 1
      },
      tileType: "570c27c3f5a9dabe23f3af90"
    },
    {
      x       : 3,
      y       : 2,
      z       : 1,
      rot     : 90,
      items   : {
        obstacles : 2,
        speedbumps: 3
      },
      tileType: "570c27c3f5a9dabe23f3af90"
    },
    {
      x       : 3,
      y       : 3,
      z       : 1,
      rot     : 270,
      items   : {
        obstacles : 2,
        speedbumps: 3
      },
      tileType: "570c27c3f5a9dabe23f3af90"
    },
    {
      x       : 3,
      y       : 4,
      z       : 1,
      rot     : 0,
      items   : {
        obstacles : 2,
        speedbumps: 3
      },
      tileType: "570c27c3f5a9dabe23f3af90"
    },
    {
      x       : 2,
      y       : 2,
      z       : 1,
      rot     : 0,
      items   : {
        obstacles : 2,
        speedbumps: 3
      },
      tileType: "570c27c3f5a9dabe23f3af90",
      levelUp : "bottom"
    }
    ,
    {
      x        : 2,
      y        : 3,
      z        : 2,
      rot      : 0,
      items    : {
        obstacles : 2,
        speedbumps: 3
      },
      tileType : "570c27c3f5a9dabe23f3af90",
      levelDown: "top"
    }
  ],
  startTile        : {x: 1, y: 1, z: 1},
  numberOfDropTiles: 3
}).save(function (err) {
  console.error(err)
})