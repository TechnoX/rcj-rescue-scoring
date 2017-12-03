// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var marker = {};
var socket;
// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$cookies',function ($scope, $uibModal, $log, $timeout, $http, $cookies) {

    var tick = function () {
        if ($scope.status == 2 && $scope.minutes < 8) {
            $scope.time += 1;
        }
    };
    setInterval(function () {
        $scope.$apply(tick);
    }, 1000);
    $scope.z = 0;
    $scope.sRotate = 0;
    // Scoring elements of the tiles
    $scope.stiles = [];
    // Map (images etc.) for the tiles
    $scope.mtiles = [];

    
    setInterval(function () {
        $scope.get_field();
    }, 10000);
  $scope.get_field_signing = function () {
      var pRunId,pName,pStatus;
      $http.get("/api/runs/line/find/" + competitionId + "/" +
                fieldId + "/3").then(function (response) {
        if (response.data.length == 0) {
          pRunId = -1;
          pName = "No Team";
          pStatus = 0;
        } else if (response.data.length == 1) {
          pRunId = response.data[0]._id;
          pName = response.data[0].team.name;
          pStatus = 3;
        } else {
          pRunId = -1;
          pName = "ERROR";
          pStatus = 0;
        }
        $scope.updateRun(pRunId,pName,pStatus);
      })
  }
  
  $scope.get_field = function () {
      var pRunId,pName,pStatus;
      $http.get("/api/runs/line/find/" + competitionId + "/" +
                fieldId + "/2").then(function (response) {
        if (response.data.length == 0) {
          pRunId = -1;
          pName = "No Team";
          pStatus = 0;
        } else if (response.data.length == 1) {
          pRunId = response.data[0]._id;
          pName = response.data[0].team.name;
          pStatus = 2;
        } else {
          pRunId = -1;
          pName = "ERROR";
          pStatus = 0;
        }
        if(pRunId == -1 && pName=='No Team') $scope.get_field_signing();
        else $scope.updateRun(pRunId,pName,pStatus);
        
      })
  }
  
    
  $scope.updateRun = function (pRunId,pName,pStatus){
      $scope.runId = pRunId;
      $scope.team = pName;
      $scope.status = pStatus;
      if ($scope.dRunId == $scope.runId){
          return;
      }
      if ($scope.dRunId != -1){
          socket.emit('unsubscribe', 'runs/' + $scope.dRunId);
      }
      if ($scope.runId == -1){
          $scope.exist = false;
          $scope.LoPs_total = 0;
          $scope.time = 0;
          $scope.score = 0;
          $scope.rescuedLiveVictims = 0;
          $scope.rescuedDeadVictims = 0;
          marker = [];
          $scope.dRunId = $scope.runId;
          return;
      }
      launchSocketIo();
      loadNewRun();
      $scope.dRunId = $scope.runId;
      $scope.exist = true;
  }
  
  socket = io(window.location.origin, {
      transports: ['websocket']
    });
  function launchSocketIo() {
    // launch socket.io
    if (typeof $scope.runId !== 'undefined') {
      socket.emit('subscribe', 'runs/' + $scope.runId);
      socket.on('data', function (data) {
                console.log(data);
                $scope.rescuedLiveVictims = data.rescuedLiveVictims;
                $scope.rescuedDeadVictims = data.rescuedDeadVictims;
                $scope.evacuationLevel = data.evacuationLevel;
                $scope.exitBonus = data.exitBonus;
                $scope.stiles = data.tiles;
                $scope.score = data.score;
                $scope.showedUp = data.showedUp;
                $scope.LoPs = data.LoPs;
                $scope.minutes = data.time.minutes;
                $scope.seconds = data.time.seconds;
                $scope.time = $scope.minutes * 60 + $scope.seconds;
                $scope.retired = data.retired;
                $scope.LoPs_total = 0;
                $scope.status = data.status;
                for (var i = 0; i < $scope.LoPs.length; i++) {
                    $scope.LoPs_total += $scope.LoPs[i];
                }
                $scope.$apply();
                console.log("Updated view from socket.io");
            });
    }
    
  }
    

    function loadNewRun() {
        $http.get("/api/runs/line/" + $scope.runId +
            "?populate=true").then(function (response) {
            console.log(response.data);
            $scope.LoPs = response.data.LoPs;
            $scope.LoPs_total = 0;
            for (var i = 0; i < $scope.LoPs.length; i++) {
                $scope.LoPs_total += $scope.LoPs[i];
            }
            $scope.evacuationLevel = response.data.evacuationLevel;
            $scope.exitBonus = response.data.exitBonus;
            $scope.field = response.data.field.name;
            $scope.rescuedDeadVictims = response.data.rescuedDeadVictims;
            $scope.rescuedLiveVictims = response.data.rescuedLiveVictims;
            $scope.score = response.data.score;
            $scope.showedUp = response.data.showedUp;
            $scope.started = response.data.started;
            $scope.round = response.data.round.name;
            $scope.team = response.data.team.name;
            $scope.competition = response.data.competition.name;
            $scope.competition_id = response.data.competition._id;
            $scope.retired = response.data.retired;
            // Verified time by timekeeper
            $scope.minutes = response.data.time.minutes;
            $scope.seconds = response.data.time.seconds;
            $scope.time = $scope.minutes * 60 + $scope.seconds;
            $scope.cap_sig = response.data.sign.captain;
            $scope.ref_sig = response.data.sign.referee;
            $scope.refas_sig = response.data.sign.referee_as;

            // Scoring elements of the tiles
            $scope.stiles = response.data.tiles;

            for (var i = 0; i < response.data.tiles.length; i++) {
                if (response.data.tiles[i].isDropTile) {
                    $scope.actualUsedDropTiles++;
                    f = true;
                }
            }

            // Get the map
            $http.get("/api/maps/line/" + response.data.map +
                "?populate=true").then(function (response) {
                console.log(response.data);

                $scope.height = response.data.height;
                $scope.width = response.data.width;
                $scope.length = response.data.length;
                width = response.data.width;
                length = response.data.length;
                $scope.startTile = response.data.startTile;
                $scope.numberOfDropTiles = response.data.numberOfDropTiles;;
                $scope.mtiles = {};
                for (var i = 0; i < response.data.tiles.length; i++) {
                    $scope.mtiles[response.data.tiles[i].x + ',' +
                        response.data.tiles[i].y + ',' +
                        response.data.tiles[i].z] = response.data.tiles[i];
                }

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

    $scope.getOpacity = function (x, y) {
        var stackedTiles = 0;
        for (var z = 0; z < $scope.height; z++) {
            if ($scope.mtiles[x + ',' + y + ',' + z])
                stackedTiles++;
        }
        return 1.0 / stackedTiles;
    }

    $scope.go = function (path) {
        socket.emit('unsubscribe', 'runs/' + runId);
        window.location = path
    }
    
    $scope.showElements = function (x, y, z) {
        var mtile = $scope.mtiles[x + ',' + y + ',' + z];
        var isDropTile = false;
        // If this is not a created tile
        if (!mtile || mtile.index.length == 0)
            return;


        for (var i = 0; i < mtile.index.length; i++) {
            if ($scope.stiles[mtile.index[i]].isDropTile) {
                isDropTile = true;
            }
        }


        var total = (mtile.items.obstacles > 0 ||
            mtile.items.speedbumps > 0 ||
            mtile.tileType.gaps > 0 ||
            mtile.tileType.intersections > 0) * mtile.index.length;
        // Add the number of possible passes for drop tiles
        if (isDropTile) {
            total += mtile.index.length;
        }

        if (total > 1) {
            // Show modal
            $scope.open(x, y, z);
        }
    }
    
    $scope.open = function (x, y, z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/line_view_modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'lm',
            resolve: {
                mtile: function () {
                    return $scope.mtiles[x + ',' + y + ',' + z];
                },
                stiles: function () {
                    return $scope.stiles;
                },
                startTile: function(){
                    return $scope.startTile;
                },
                nineTile: function () {
                    var nine = []
                    nine[0] = $scope.mtiles[(x - 1) + ',' + (y - 1) + ',' + z];
                    nine[1] = $scope.mtiles[(x) + ',' + (y - 1) + ',' + z];
                    nine[2] = $scope.mtiles[(x + 1) + ',' + (y - 1) + ',' + z];
                    nine[3] = $scope.mtiles[(x - 1) + ',' + (y) + ',' + z];
                    nine[4] = $scope.mtiles[(x) + ',' + (y) + ',' + z];
                    nine[5] = $scope.mtiles[(x + 1) + ',' + (y) + ',' + z];
                    nine[6] = $scope.mtiles[(x - 1) + ',' + (y + 1) + ',' + z];
                    nine[7] = $scope.mtiles[(x) + ',' + (y + 1) + ',' + z];
                    nine[8] = $scope.mtiles[(x + 1) + ',' + (y + 1) + ',' + z];
                    return nine;
                }
            }
        }).closed.then(function (result) {
            console.log("Closed modal");
        });
    }
    
    $scope.navColor = function (stat){
        if(stat == 2) return '#e74c3c';
        if(stat == 3) return '#e67e22';
        return '#7f8c8d';
    }
    
    $scope.get_field();

    


}]).directive("tileLoadFinished", function ($timeout) {
    return function (scope, element, attrs) {
        if (scope.$last) {
            $timeout(function () {
                tile_size();
            }, 0);
            $timeout(function () {
                tile_size();
            }, 500);
            $timeout(function () {
                tile_size();
            }, 1000);
        }
    }
});


app.directive('tile', function () {
    return {
        scope: {
            tile: '='
        },
        restrict: 'E',
        templateUrl: '/templates/tile.html',
        link: function ($scope, element, attrs) {
            $scope.tilerotate = function (tilerot) {
                if(!tilerot)return $scope.$parent.sRotate;
                var ro = tilerot + $scope.$parent.sRotate;
                if(ro >= 360)ro -= 360;
                else if(ro < 0) ro+= 360;
                return ro;
            }
            $scope.tileNumber = function (tile) {
                $scope.tileN = 1;
                var ret_txt = "";
                if (!tile) return;

                var possible = 0;

                var count = function (list) {
                    for (var i = 0; i < list.length; i++) {
                        possible++;
                    }
                }
                count(tile.scoredItems.gaps);
                count(tile.scoredItems.speedbumps);
                count(tile.scoredItems.intersections);
                count(tile.scoredItems.obstacles);
                if (possible != 0) return;

                for (var i = 0; i < tile.index.length; i++) {
                    if (i != 0) ret_txt += ','
                    ret_txt += tile.index[i] + 1;
                }
                return ret_txt;
            }
            $scope.checkpointNumber = function (tile) {
                var ret_txt = "";
                if (!tile) return;
                for (var i = 0; i < tile.index.length; i++) {
                    if (marker[tile.index[i]]) {
                        var count = 0;
                        for (var j = 0; j < tile.index[i]; j++) {
                            if (marker[j]) count++;
                        }
                        count++;
                        if (i != 0) ret_txt += '&'
                        ret_txt += count;
                    } else {
                        return;
                    }
                }
                return ret_txt;
            }


            $scope.isDropTile = function (tile) {
                if ((!tile || tile.index.length == 0) && !isStart(tile))
                    return;
                return $scope.$parent.stiles[tile.index[0]].isDropTile;
            }

            $scope.isStart = function (tile) {
                if (!tile)
                    return;
                return tile.x == $scope.$parent.startTile.x &&
                    tile.y == $scope.$parent.startTile.y &&
                    tile.z == $scope.$parent.startTile.z;
            }

            function isStart(tile) {
                if (!tile)
                    return;
                return tile.x == $scope.$parent.startTile.x &&
                    tile.y == $scope.$parent.startTile.y &&
                    tile.z == $scope.$parent.startTile.z;
            }

            $scope.tileStatus = function (tile) {
                // If this is a non-existent tile
                if (!tile || tile.index.length == 0)
                    return;

                // If this tile has no scoring elements we should just return empty string
                if (tile.items.obstacles == 0 &&
                    tile.items.speedbumps == 0 &&
                    tile.tileType.gaps == 0 &&
                    tile.tileType.intersections == 0 &&
                    !$scope.$parent.stiles[tile.index[0]].isDropTile && !isStart(tile)
                ) {
                    return;
                }

                // Number of successfully passed times
                var successfully = 0;
                // Number of times it is possible to pass this tile
                var possible = tile.index.length;

                for (var i = 0; i < tile.index.length; i++) {
                    if ($scope.$parent.stiles[tile.index[i]].scored) {
                        successfully++;
                    }
                }
                if (tile.processing)
                    return "processing";
                else if ((possible > 0 && successfully == possible) ||
                    (isStart(tile) && $scope.$parent.showedUp))
                    return "done";
                else if (successfully > 0)
                    return "halfdone";
                else if (possible > 0 || (isStart(tile) && !$scope.$parent.showedUp))
                    return "undone";
                else
                    return "";
            }

            $scope.rotateRamp = function (direction) {
                var ro;
                switch (direction) {
                    case "bottom":
                        ro = 0;
                        break;
                    case "top":
                        ro = 180;
                        break;
                    case "left":
                        ro = 90;
                        break;
                    case "right":
                        ro = 270;
                        break;
                }
                ro += $scope.$parent.sRotate;
                if(ro >= 360)ro-=360;
                else if(ro < 0)ro+=360;
                switch (ro) {
                    case 0:
                        return;
                    case 180:
                        return "fa-rotate-180";
                    case 90:
                        return "fa-rotate-90";
                    case 270:
                        return "fa-rotate-270";
                }
            }

        }
    };
});

    
app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, mtile, stiles, nineTile,startTile) {
    $scope.mtile = mtile;
    $scope.stiles = stiles;
    $scope.nineTile = nineTile;
    $scope.words = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"];
    $scope.next = [];
    for (var i = 0, d; d = mtile.next[i]; i++) {
        var sp = d.split(",");

        if (mtile.x == Number(sp[0]) && mtile.y - 1 == Number(sp[1])) {
            //console.log("TOP");
                    $scope.next.top = mtile.index[i];
            }
            
        if (mtile.x + 1 == Number(sp[0]) && mtile.y == Number(sp[1])) {
            //console.log("RIGHT");

                    $scope.next.right = mtile.index[i];
        }
        if (mtile.x == Number(sp[0]) && mtile.y + 1 == Number(sp[1])) {
            //console.log("BOTTOM");
           
                    $scope.next.bottom = mtile.index[i];
        }
        if (mtile.x - 1 == Number(sp[0]) && mtile.y == Number(sp[1])) {
            //console.log("LEFT");
                    $scope.next.left = mtile.index[i];
        }

    }

    $scope.tilerotate = function (tilerot) {
        return tilerot;
    }
    
     $scope.isDropTile = function (tile) {
        if (!tile || tile.index.length == 0)
            return;
        return $scope.stiles[tile.index[0]].isDropTile;
    }

    $scope.isStart = function (tile) {
        console.log(tile);
        if (!tile)
            return;
        return tile.x == startTile.x &&
            tile.y == startTile.y &&
            tile.z == startTile.z;
    }
    
    $scope.rotateRamp = function (direction) {
        var ro;
        switch (direction) {
            case "bottom":
                ro = 0;
                break;
            case "top":
                ro = 180;
                break;
            case "left":
                ro = 90;
                break;
            case "right":
                ro = 270;
                break;
        }
        switch (ro) {
            case 0:
                return;
            case 180:
                return "fa-rotate-180";
            case 90:
                return "fa-rotate-90";
            case 270:
                return "fa-rotate-270";
        }
    }
    $scope.ok = function () {
        $uibModalInstance.close();
    };
});

function tile_size() {
    $(function () {
        try {
            var tilesize_w = (window.innerWidth - 100) / width;
            var tilesize_h = (window.innerHeight * 0.7) / length;
            console.log('tilesize_w:' + tilesize_w);
            console.log('tilesize_h:' + tilesize_h);
            if (tilesize_h > tilesize_w) var tilesize = tilesize_w;
            else var tilesize = tilesize_h;
            $('tile').css('height', tilesize);
            $('tile').css('width', tilesize);
            $('.tile-image').css('height', tilesize);
            $('.tile-image').css('width', tilesize);
            $('.tile-font').css('font-size', tilesize - 10);
            $('.tile-font-1-25').css('font-size', tilesize / 2.5);
            $('.slot').css('height', tilesize);
            $('.slot').css('width', tilesize);
            $('#card_area').css('height', (window.innerHeight - 150));
            $('.chnumtxt').css('font-size', tilesize / 6);
            if (b.height() == 0) setTimeout("tile_size()", 500);
        } catch (e) {
            setTimeout("tile_size()", 1000);
        }


    });
}


var currentWidth = -1;


$(window).on('beforeunload', function () {
    socket.emit('unsubscribe', 'runs/' + runId);
});


let lastTouch = 0;
document.addEventListener('touchend', event => {
    const now = window.performance.now();
    if (now - lastTouch <= 500) {
        event.preventDefault();
    }
    lastTouch = now;
}, true);
