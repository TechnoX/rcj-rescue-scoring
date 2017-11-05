// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);
var socket;
// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', function ($scope, $uibModal, $log, $timeout, $http) {
  
  $scope.z = 0;
  
  $scope.visType = "slider";
  $scope.countWords = ["Bottom", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Ninth"];
  $scope.sliderOptions = {
    floor           : 0,
    ceil            : 0,
    showSelectionBar: true,
    showTicksValues : true
  };
  var tick = function () {
        if ($scope.status == 2 && $scope.minutes < 8) {
            $scope.time += 1;
        }
    };
    setInterval(function () {
        $scope.$apply(tick);
    }, 1000);
  $scope.cells = {};
  $scope.tiles = {};
  
  if (typeof runId !== 'undefined') {
    loadNewRun();
  }
  
  (function launchSocketIo() {
    // launch socket.io
    socket = io(window.location.origin, {
      transports: ['websocket']
    });
    if (typeof runId !== 'undefined') {
      socket.emit('subscribe', 'runs/' + runId);
      socket.on('data', function (data) {
        console.log(data);
        $scope.exitBonus = data.exitBonus;
        $scope.score = data.score;
        $scope.LoPs = data.LoPs;
        
        // Verified time by timekeeper
        $scope.minutes = data.time.minutes;
        $scope.seconds = data.time.seconds;
        $scope.time = $scope.minutes * 60 + $scope.seconds;
        // Scoring elements of the tiles
        for (var i = 0; i < data.tiles.length; i++) {
          $scope.tiles[data.tiles[i].x + ',' +
                       data.tiles[i].y + ',' +
                       data.tiles[i].z] = data.tiles[i];
        }
        $scope.$apply();
        console.log("Updated view from socket.io");
      });
    }
    if (typeof fieldId !== 'undefined') {
      console.log("Field ID: ", fieldId);
      socket.emit('subscribe', 'fields/' + fieldId);
      socket.on('data', function (data) {
        //                if(typeof runId === 'undefined') || runId != data.newRun){ // TODO: FIX!
        console.log("Judge changed to a new run");
        runId = data.newRun;
        loadNewRun();
        //                }
      });
      
      
    } else {
      console.log("No fieldId provided");
    }
    
  })();
  
  
  function loadNewRun() {
    $http.get("/api/runs/maze/" + runId +
              "?populate=true").then(function (response) {
      
      console.log(response.data);
      $scope.exitBonus = response.data.exitBonus;
      $scope.field = response.data.field.name;
      $scope.round = response.data.round.name;
      $scope.score = response.data.score;
      $scope.team = response.data.team.name;
      $scope.league = response.data.team.league;
      $scope.competition = response.data.competition.name;
      $scope.competition_id = response.data.competition._id;
      $scope.LoPs = response.data.LoPs;
      $scope.status = response.data.status;
      
      // Verified time by timekeeper
      $scope.minutes = response.data.time.minutes;
      $scope.seconds = response.data.time.seconds;
      $scope.time = $scope.minutes * 60 + $scope.seconds;
      $scope.cap_sig = response.data.sign.captain;
      $scope.ref_sig = response.data.sign.referee;
      $scope.refas_sig = response.data.sign.referee_as;
      
      // Scoring elements of the tiles
      for (var i = 0; i < response.data.tiles.length; i++) {
        $scope.tiles[response.data.tiles[i].x + ',' +
                     response.data.tiles[i].y + ',' +
                     response.data.tiles[i].z] = response.data.tiles[i];
      }
      
      // Get the map
      $http.get("/api/maps/maze/" + response.data.map +
                "?populate=true").then(function (response) {
        console.log(response.data);
        $scope.startTile = response.data.startTile;
        $scope.height = response.data.height;
        $scope.sliderOptions.ceil = $scope.height - 1;
        $scope.width = response.data.width;
        $scope.length = response.data.length;
        
        for (var i = 0; i < response.data.cells.length; i++) {
          $scope.cells[response.data.cells[i].x + ',' +
                       response.data.cells[i].y + ',' +
                       response.data.cells[i].z] = response.data.cells[i];
        }
        
        width = response.data.width;
        length = response.data.length;
        height = response.data.height;
        if (height > 2) height = 2;
        console.log("h" + height);
        
      }, function (response) {
        console.log("Error: " + response.statusText);
      });
      
    }, function (response) {
      console.log("Error: " + response.statusText);
    });
  }
  
  $scope.range = function (n) {
    arr = [];
    for (var i = 0; i < n; i++) {
      arr.push(i);
    }
    return arr;
  }
  
  
  $scope.isUndefined = function (thing) {
    return (typeof thing === "undefined");
  }
  
  
  $scope.tileStatus = function (x, y, z, isTile) {
    // If this is a non-existent tile
    var cell = $scope.cells[x + ',' + y + ',' + z];
    if (!cell)
      return;
    if (!isTile)
      return;
    
    if (!$scope.tiles[x + ',' + y + ',' + z]) {
      $scope.tiles[x + ',' + y + ',' + z] = {
        scoredItems: {
          speedbump : false,
          checkpoint: false,
          rampBottom: false,
          rampTop   : false,
          victims   : {
            top   : false,
            right : false,
            left  : false,
            bottom: false
          },
          rescueKits: {
            top   : 0,
            right : 0,
            bottom: 0,
            left  : 0
          }
        }
      };
    }
    var tile = $scope.tiles[x + ',' + y + ',' + z];
    
    // Current "score" for this tile
    var current = 0;
    // Max "score" for this tile. Score is added 1 for every passed mission
    var possible = 0;
    
    
    if (cell.tile.speedbump) {
      possible++;
      if (tile.scoredItems.speedbump) {
        current++;
      }
    }
    if (cell.tile.checkpoint) {
      possible++;
      if (tile.scoredItems.checkpoint) {
        current++;
      }
    }
    if (cell.tile.rampBottom) {
      possible++;
      if (tile.scoredItems.rampBottom) {
        current++;
      }
    }
    if (cell.tile.rampTop) {
      possible++;
      if (tile.scoredItems.rampTop) {
        current++;
      }
    }
    switch (cell.tile.victims.top) {
      case 'Heated':
        possible++;
        current += tile.scoredItems.victims.top ||
                   tile.scoredItems.rescueKits.top > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.top >= 1);
        break;
      case 'H':
        possible++;
        current += tile.scoredItems.victims.top ||
                   tile.scoredItems.rescueKits.top > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.top >= 2);
        break;
      case 'S':
        possible++;
        current += tile.scoredItems.victims.top ||
                   tile.scoredItems.rescueKits.top > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.top >= 1);
        break;
      case 'U':
        possible++;
        current += tile.scoredItems.victims.top ||
                   tile.scoredItems.rescueKits.top > 0;
        break;
    }
    switch (cell.tile.victims.right) {
      case 'Heated':
        possible++;
        current += tile.scoredItems.victims.right ||
                   tile.scoredItems.rescueKits.right > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.right >= 1);
        break;
      case 'H':
        possible++;
        current += tile.scoredItems.victims.right ||
                   tile.scoredItems.rescueKits.right > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.right >= 2);
        break;
      case 'S':
        possible++;
        current += tile.scoredItems.victims.right ||
                   tile.scoredItems.rescueKits.right > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.right >= 1);
        break;
      case 'U':
        possible++;
        current += tile.scoredItems.victims.right ||
                   tile.scoredItems.rescueKits.right > 0;
        break;
    }
    switch (cell.tile.victims.bottom) {
      case 'Heated':
        possible++;
        current += tile.scoredItems.victims.bottom ||
                   tile.scoredItems.rescueKits.bottom > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.bottom >= 1);
        break;
      case 'H':
        possible++;
        current += tile.scoredItems.victims.bottom ||
                   tile.scoredItems.rescueKits.bottom > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.bottom >= 2);
        break;
      case 'S':
        possible++;
        current += tile.scoredItems.victims.bottom ||
                   tile.scoredItems.rescueKits.bottom > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.bottom >= 1);
        break;
      case 'U':
        possible++;
        current += tile.scoredItems.victims.bottom ||
                   tile.scoredItems.rescueKits.bottom > 0;
        break;
    }
    switch (cell.tile.victims.left) {
      case 'Heated':
        possible++;
        current += tile.scoredItems.victims.left ||
                   tile.scoredItems.rescueKits.left > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.left >= 1);
        break;
      case 'H':
        possible++;
        current += tile.scoredItems.victims.left ||
                   tile.scoredItems.rescueKits.left > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.left >= 2);
        break;
      case 'S':
        possible++;
        current += tile.scoredItems.victims.left ||
                   tile.scoredItems.rescueKits.left > 0;
        possible++;
        current += (tile.scoredItems.rescueKits.left >= 1);
        break;
      case 'U':
        possible++;
        current += tile.scoredItems.victims.left ||
                   tile.scoredItems.rescueKits.left > 0;
        break;
    }
    
    
    if (current > 0 && current == possible)
      return "done";
    else if (current > 0)
      return "halfdone";
    else if (possible > 0)
      return "undone";
    else
      return "";
  }
  
  $scope.cellClick = function (x, y, z, isWall, isTile) {
    var cell = $scope.cells[x + ',' + y + ',' + z];
    if (!cell)
      return;
    if (!isTile)
      return;
    
    var hasVictims = (cell.tile.victims.top != "None") ||
                     (cell.tile.victims.right != "None") ||
                     (cell.tile.victims.bottom != "None") ||
                     (cell.tile.victims.left != "None");
    
    // Total number of scorable things on this tile
    var total = !!cell.tile.speedbump + !!cell.tile.checkpoint +
                !!cell.tile.rampBottom + !!cell.tile.rampTop +
                hasVictims;
    
    if (total > 1 || hasVictims) {
      // Open modal for multi-select
      $scope.open(x, y, z);
    }
    
  }
  
  $scope.go = function (path) {
    socket.emit('unsubscribe', 'runs/' + runId);
    window.location = path
  }
  
  $scope.open = function (x, y, z) {
    var modalInstance = $uibModal.open({
      animation  : true,
      templateUrl: '/templates/maze_view_modal.html',
      controller : 'ModalInstanceCtrl',
      size       : 'sm',
      resolve    : {
        cell: function () {
          return $scope.cells[x + ',' + y + ',' + z];
        },
        tile: function () {
          return $scope.tiles[x + ',' + y + ',' + z];
        }
      }
    }).closed.then(function (result) {
      console.log("Closed modal");
    });
  };
  
  
}]);


app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, cell, tile) {
  $scope.cell = cell;
  $scope.tile = tile;
  $scope.hasVictims = (cell.tile.victims.top != "None") ||
                      (cell.tile.victims.right != "None") ||
                      (cell.tile.victims.bottom != "None") ||
                      (cell.tile.victims.left != "None");
  
  $scope.ok = function () {
    $uibModalInstance.close();
  };
});

function tile_size() {
  $(function () {
    try {
      var b = $('.tilearea');
      //console.log('コンテンツ本体：' + b.height() + '×' + b.width());
      //console.log('window：' + window.innerHeight);
      var tilesize_w = (b.width() - (70 + 11 * (width + 1) * height)) /
                       (width * height);
      var tilesize_h = (window.innerHeight - (200 + 11 * (length + 1))) /
                       length;
      console.log(width + 'tilesize_w:' + tilesize_w);
      console.log('tilesize_h:' + tilesize_h);
      if (tilesize_h > tilesize_w) var tilesize = tilesize_w;
      else var tilesize = tilesize_h;
      
      $('.tile-image-container').css('height', tilesize);
      $('.tile-image-container').css('width', tilesize);
      $('.tile-image').css('height', tilesize);
      $('.tile-image').css('width', tilesize);
      $('.tile-font').css('font-size', tilesize - 10);
      if (b.height() == 0) setTimeout("tile_size()", 500);
    } catch (e) {
      setTimeout("tile_size()", 500);
    }
    
    
  });
}

var currentWidth = -1;

$(window).on('beforeunload', function () {
  socket.emit('unsubscribe', 'runs/' + runId);
});

$(window).on('load resize', function () {
  if (currentWidth == window.innerWidth) {
    return;
  }
  currentWidth = window.innerWidth;
  tile_size();
  
});

let lastTouch = 0;
document.addEventListener('touchend', event => {
  const now = window.performance.now();
  if (now - lastTouch <= 500) {
    event.preventDefault();
  }
  lastTouch = now;
}, true);
