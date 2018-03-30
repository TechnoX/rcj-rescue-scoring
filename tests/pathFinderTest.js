/*const pathFinder = require('../leagues/line/pathFinder')


pathFinder({
    name     : "Test2",
    height   : 1,
    width    : 2,
    length   : 3,
    tiles    : [{
      x       : 1,
      y       : 1,
      z       : 1,
      rot     : 0,
      items   : {
        obstacles : 2,
        speedbumps: 3
      },
      tileType: {
        gaps         : 0,
        intersections: 0,
        paths        : {
          "right": "left",
          "left" : "right"
        }
      }
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
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "right": "bottom",
            "left" : "right"
          }
        }
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
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "bottom": "left",
            "left"  : "bottom"
          }
        }
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
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "right": "left",
            "left" : "right"
          }
        }
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
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "right": "left",
            "left" : "right"
          }
        }
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
        tileType: {
          gaps         : 0,
          intersections: 0,
          paths        : {
            "top": "top"
          }
        }
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
        tileType: {
          gaps         : 1,
          intersections: 0,
          paths        : {
            "top"   : "bottom",
            "bottom": "top"
          }
        },
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
        tileType : {
          gaps         : 1,
          intersections: 0,
          paths        : {
            "top"   : "bottom",
            "bottom": "top"
          }
        },
        levelDown: "top"
      }
    ],
    startTile: {x: 1, y: 1, z: 1}
  }
)
*/