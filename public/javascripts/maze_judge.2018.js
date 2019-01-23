// register the directive with your app module
var app = angular.module('ddApp', ['ngTouch','ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http','$translate', '$cookies',function ($scope, $uibModal, $log, $timeout, $http, $translate, $cookies) {

    var txt_timeup,txt_timeup_mes;

    $translate('maze.judge.js.timeup.title').then(function (val) {
        txt_timeup = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('maze.judge.js.timeup.content').then(function (val) {
        txt_timeup_mes = val;
    }, function (translationId) {
        // = translationId;
    });


    $scope.sync = 0;
    $scope.z = 0;
    $scope.startedTime = false;
    $scope.time = 0;
    $scope.startUnixTime = 0;

    $scope.runId = runId;
    var date = new Date();
    var prevTime = 0;

    $scope.checkTeam = $scope.checkRound = $scope.checkMember = $scope.checkMachine = false;
    $scope.toggleCheckTeam = function(){
        $scope.checkTeam = !$scope.checkTeam;
        playSound(sClick);
    }
    $scope.toggleCheckRound = function(){
        $scope.checkRound = !$scope.checkRound;
        playSound(sClick);
    }
    $scope.toggleCheckMember = function(){
        $scope.checkMember = !$scope.checkMember;
        playSound(sClick);
    }
    $scope.toggleCheckMachine = function(){
        $scope.checkMachine = !$scope.checkMachine;
        playSound(sClick);
    }
    $scope.checks = function(){
        return ($scope.checkTeam & $scope.checkRound & $scope.checkMember & $scope.checkMachine)
    }


    const http_config = {
        timeout: 10000
    };

    function upload_run(data) {
      if($scope.tiles){
        let tmp = {
            map: {
                cells: db_cells
            },
            tiles: $scope.tiles,
            LoPs: $scope.LoPs,
            exitBonus: $scope.exitBonus,
        };
        console.log(tmp);
        $scope.score = maze_calc_score(tmp);
      }
        if ($scope.networkError) {
            $scope.saveEverything();
            return;
        }

        $scope.sync++;
        $http.put("/api/runs/maze/" + runId, Object.assign(data, {
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: Math.floor(($scope.time % 60000) / 1000)
            }
        }), http_config).then(function (response) {
            console.log(response);
            //$scope.score = response.data.score;
            $scope.sync--;
        }, function (response) {
            if (response.status == 401) {
                $scope.go('/home/access_denied');
            }
            $scope.networkError = true;
        });

    }



    $scope.lopProcessing = false;

    //$cookies.remove('sRotate')
    if($cookies.get('sRotate')){
        $scope.sRotate = Number($cookies.get('sRotate'));
    }
    else $scope.sRotate = 0;

    $scope.cells = {};
    $scope.tiles = {};

    var db_cells;

    $http.get("/api/runs/maze/" + runId +
        "?populate=true").then(function (response) {

        console.log(response.data);
        $scope.exitBonus = response.data.exitBonus;
        $scope.field = response.data.field.name;
        $scope.round = response.data.round.name;
        $scope.score = response.data.score;
        $scope.team = response.data.team;
        $scope.league = response.data.team.league;
        $scope.competition = response.data.competition;
        $scope.LoPs = response.data.LoPs;

        // Verified time by timekeeper
        $scope.minutes = response.data.time.minutes;
        $scope.seconds = response.data.time.seconds;
        $scope.time = ($scope.minutes * 60 + $scope.seconds)*1000;
        prevTime = $scope.time;

        // Scoring elements of the tiles
        for (let i = 0; i < response.data.tiles.length; i++) {
            $scope.tiles[response.data.tiles[i].x + ',' +
                response.data.tiles[i].y + ',' +
                response.data.tiles[i].z] = response.data.tiles[i];
        }


        $scope.loadMap(response.data.map);

        if (document.referrer.indexOf('sign') != -1 || document.referrer.indexOf('approval') != -1) {
            $scope.checked = true;
            if(document.referrer.indexOf('approval') != -1){
              $scope.fromApproval = true;
            }
            $timeout($scope.tile_size, 10);
            $timeout($scope.tile_size, 200);
        }else{
            let data = {
                status: 1
            };
            $http.put("/api/runs/maze/" + runId, data, http_config).then(function (response) {
                //$scope.score = response.data.score;
            }, function (response) {
                if (response.status == 401) {
                    $scope.go('/home/access_denied');
                }
            });
        }



    }, function (response) {
        console.log("Error: " + response.statusText);
        if (response.status == 401) {
            $scope.go('/home/access_denied');
        }
    });

    $scope.randomDice = function(){
        playSound(sClick);
        var a = Math.floor( Math.random() * 6 ) ;
        $scope.changeMap(a);
    }

    $scope.changeMap = function(n){
        playSound(sClick);
        $scope.diceSelect = n;
        $scope.sync++;
        $http.put("/api/runs/maze/map/" + runId, {
            map: $scope.dice[n]
        }).then(function (response) {
            $scope.loadMap(response.data.map._id);
            $scope.sync--;
        }, function (response) {
            console.log("Error: " + response.statusText);
            if (response.status == 401) {
                $scope.go('/home/access_denied');
            }
            $scope.networkError = true;
        });
    }

    $scope.loadMap = function(mapId){
        // Get the map
        $http.get("/api/maps/maze/" + mapId +
            "?populate=true").then(function (response) {
            console.log(response.data);
            $scope.startTile = response.data.startTile;
            $scope.height = response.data.height;

            $scope.width = response.data.width;
            $scope.length = response.data.length;
            if(response.data.parent){
                if(!$scope.dice){
                    $http.get("/api/maps/maze/" + response.data.parent).then(function (response) {
                        $scope.dice = response.data.dice;
                    }, function (response) {
                        console.log("Error: " + response.statusText);
                    });
                }

            }else{
                $scope.dice = response.data.dice;
            }

            for (let i = 0; i < response.data.cells.length; i++) {
                $scope.cells[response.data.cells[i].x + ',' +
                    response.data.cells[i].y + ',' +
                    response.data.cells[i].z] = response.data.cells[i];
            }

            db_cells = response.data.cells;

            width = response.data.width;
            length = response.data.length;
            $timeout($scope.tile_size, 100);

        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    }

    $scope.range = function (n) {
        arr = [];
        for (let i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.timeReset = function () {
        playSound(sClick);
        prevTime = 0;
        $scope.time = 0;
        $scope.saveEverything();
    }

    $scope.infochecked = function () {
        playSound(sClick);
        $scope.checked = true;
        //$timeout($scope.tile_size, 10);
        $timeout($scope.tile_size, 200);
        $timeout($scope.tile_size, 2000);
        scrollTo( 0, 0 ) ;
    }
    $scope.decrement = function () {
        playSound(sClick);
        $scope.LoPs--;
        if ($scope.LoPs < 0)
            $scope.LoPs = 0;

        upload_run({
          LoPs: $scope.LoPs
        });

    }
    $scope.increment = function () {
        playSound(sClick);
        $scope.LoPs++;

        upload_run({
          LoPs: $scope.LoPs
        });
    }

    $scope.changeFloor = function (z){
        playSound(sClick);
        $scope.z = z;
    }

    $scope.tileRot = function (r){
        playSound(sClick);
        $scope.sRotate += r;
        if($scope.sRotate >= 360)$scope.sRotate -= 360;
        else if($scope.sRotate < 0) $scope.sRotate+= 360;
        $timeout($scope.tile_size, 50);

        $cookies.put('sRotate', $scope.sRotate, {
          path: '/'
        });
    }

    var tick = function () {
        if ($scope.startedTime) {
            date = new Date();
            $scope.time = prevTime + (date.getTime() - $scope.startUnixTime);
            $scope.minutes = Math.floor($scope.time / 60000);
            $scope.seconds = Math.floor(($scope.time % 60000) / 1000);
            if ($scope.time >= 480000) {
                playSound(sTimeup);
                $scope.startedTime = !$scope.startedTime;
                $scope.time = 480000;
                $scope.saveEverything();
                swal(txt_timeup, txt_timeup_mes, "info");
            }
            $timeout(tick, 1000);
        }
    }

    $scope.toggleTime = function () {
        playSound(sClick);
        // Start/stop timer
        $scope.startedTime = !$scope.startedTime;
        if ($scope.startedTime) {
            // Start the timer
            $timeout(tick, 0);
            date = new Date();
            $scope.startUnixTime = date.getTime();

            upload_run({
              status: 2
            });
        } else {
            // Save everything when you stop the time
            date = new Date();
            $scope.time = prevTime + (date.getTime() - $scope.startUnixTime);
            prevTime = $scope.time;
            $scope.saveEverything();
        }
    }

    $scope.changeExitBonus = function () {
        playSound(sClick);
        $scope.exitBonus = ! $scope.exitBonus
        upload_run({
          exitBonus: $scope.exitBonus
        });
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
                    speedbump: false,
                    checkpoint: false,
                    rampBottom: false,
                    rampTop: false,
                    victims: {
                        top: false,
                        right: false,
                        left: false,
                        bottom: false
                    },
                    rescueKits: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
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

        if (tile.processing)
            return "processing";
        else if (current > 0 && current == possible)
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
        playSound(sClick);

        if (!$scope.tiles[x + ',' + y + ',' + z]) {
            $scope.tiles[x + ',' + y + ',' + z] = {
                scoredItems: {
                    speedbump: false,
                    checkpoint: false,
                    rampBottom: false,
                    rampTop: false,
                    victims: {
                        top: false,
                        right: false,
                        left: false,
                        bottom: false
                    },
                    rescueKits: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    }
                }
            };
        }
        var tile = $scope.tiles[x + ',' + y + ',' + z];

        var hasVictims = (cell.tile.victims.top != "None") ||
            (cell.tile.victims.right != "None") ||
            (cell.tile.victims.bottom != "None") ||
            (cell.tile.victims.left != "None");

        console.log(cell.tile);
        // Total number of scorable things on this tile
        var total = !!cell.tile.speedbump + !!cell.tile.checkpoint +
            !!cell.tile.rampBottom + !!cell.tile.rampTop +
            hasVictims;
        console.log("totalt antal saker", total);
        console.log("Has victims", hasVictims);

        if (total == 1 && !hasVictims) {
            if (cell.tile.speedbump) {
                tile.scoredItems.speedbump = !tile.scoredItems.speedbump;
            }
            if (cell.tile.checkpoint) {
                tile.scoredItems.checkpoint = !tile.scoredItems.checkpoint;
            }
            if (cell.tile.rampBottom) {
                tile.scoredItems.rampBottom = !tile.scoredItems.rampBottom;
            }
            if (cell.tile.rampTop) {
                tile.scoredItems.rampTop = !tile.scoredItems.rampTop;
            }
            var httpdata = {
                tiles: {
          [x + ',' + y + ',' + z]: tile
                }
            };
            upload_run(httpdata);
        } else if (total > 1 || hasVictims) {
            // Open modal for multi-select
            $scope.open(x, y, z);
        }

    }

    $scope.open = function (x, y, z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/maze_judge_modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'lm',
            resolve: {
                cell: function () {
                    return $scope.cells[x + ',' + y + ',' + z];
                },
                tile: function () {
                    return $scope.tiles[x + ',' + y + ',' + z];
                },
                sRotate: function (){
                    return $scope.sRotate;
                }
            }
        }).closed.then(function (result) {
            let httpdata = {
                tiles: {
          [x + ',' + y + ',' + z]: $scope.tiles[x + ',' + y + ',' + z]
                }
            };
            upload_run(httpdata);
        });
    };

    $scope.saveEverything = function () {
        var run = {}
        run.exitBonus = $scope.exitBonus;
        run.LoPs = $scope.LoPs;

        // Scoring elements of the tiles
        run.tiles = $scope.tiles;
        $scope.minutes = Math.floor($scope.time / 60000)
        $scope.seconds = Math.floor(($scope.time % 60000) / 1000)
        run.time = {
            minutes: $scope.minutes,
            seconds: $scope.seconds
        };

        console.log("Update run", run);
        $http.put("/api/runs/maze/" + runId, run, http_config).then(function (response) {
            $scope.score = response.data.score;
            $scope.networkError = false;
            $scope.sync = 0;
        }, function (response) {
            console.log("Error: " + response.statusText);
            $scope.networkError = true;
        });
    };

    $scope.confirm = function () {
        playSound(sClick);
        var run = {}
        run.exitBonus = $scope.exitBonus;
        run.LoPs = $scope.LoPs;

        // Scoring elements of the tiles
        run.tiles = $scope.tiles;

        // Verified time by timekeeper
        run.time = {};
        run.time.minutes = $scope.minutes;;
        run.time.seconds = $scope.seconds;
        run.status = 3;

        $http.put("/api/runs/maze/" + runId, run).then(function (response) {
            $scope.score = response.data.score;
            $scope.go('/maze/sign/' + runId + '?return=' + $scope.getParam('return'));
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    };

      $scope.backApproval = function () {
        playSound(sClick);
        var run = {}
        run.exitBonus = $scope.exitBonus;
        run.LoPs = $scope.LoPs;

        // Scoring elements of the tiles
        run.tiles = $scope.tiles;

        // Verified time by timekeeper
        run.time = {};
        run.time.minutes = $scope.minutes;;
        run.time.seconds = $scope.seconds;
        run.status = 5;

        $http.put("/api/runs/maze/" + runId, run).then(function (response) {
          $scope.score = response.data.score;
          $scope.go('/maze/approval/' + runId + '?return=' + $scope.getParam('return'));
        }, function (response) {
          console.log("Error: " + response.statusText);
        });
      };

    $scope.getParam = function (key) {
        var str = location.search.split("?");
        if (str.length < 2) {
          return "";
        }

        var params = str[1].split("&");
        for (var i = 0; i < params.length; i++) {
          var keyVal = params[i].split("=");
          if (keyVal[0] == key && keyVal.length == 2) {
            return decodeURIComponent(keyVal[1]);
          }
        }
        return "";
    }

    $scope.go = function (path) {
        playSound(sClick);
        window.location = path
    }

    $scope.tile_size = function () {
        try {
            var b = $('.tilearea');

            if($scope.sRotate%180 == 0){
                var tilesize_w = (b.width()-2*(width+1)) / (width+1 + (width+1)/12);
                //console.log(tilesize_w);
                var tilesize_h = (window.innerHeight) /(length + length/12*(length+1));
            }else{
                var tilesize_w = (b.width() - (20 + 11 * (length + 1))) / length;
                var tilesize_h = (window.innerHeight - (130 + 11 * (width + 1))) /width;
            }


            if (tilesize_h > tilesize_w) var tilesize = tilesize_w;
            else var tilesize = tilesize_h;

            $('.tile-image-container').css('height', tilesize);
            $('.tile-image-container').css('width', tilesize);
            $('.tile-image').css('height', tilesize);
            $('.tile-image').css('width', tilesize);
            $('.tile').css('height', tilesize);
            $('.tile').css('width', tilesize);
            $('.tile-font').css('font-size', tilesize - 10);
            $('.cell').css('padding', tilesize/12);


            if($scope.sRotate%180 == 0){
                $('#wrapTile').css('width', (tilesize+10)*width+11);
            }else{
                $('#wrapTile').css('width', (tilesize+10)*length+11);
            }
        } catch (e) {
            $timeout($scope.tile_size, 500);
        }
      }

      $scope.handover = function () {
        var run = {}
        run.exitBonus = $scope.exitBonus;
        run.LoPs = $scope.LoPs;

        // Scoring elements of the tiles
        run.tiles = $scope.tiles;
        $scope.minutes = Math.floor($scope.time / 60000)
        $scope.seconds = Math.floor(($scope.time % 60000) / 1000)
        run.time = {
            minutes: $scope.minutes,
            seconds: $scope.seconds
        };
        run.status = 3;

        swal({
            title: 'Scan it !',
            html: '<div style="text-align: center;"><div id="qr_code_area"></div></div>',
            showCloseButton: true
        }).then((result) => {
            stopMakeQR();
        })
        createMultiQR(run, "qr_code_area", 70);
      }


var currentWidth = -1;


$(window).on('load resize', function () {
    if (currentWidth == window.innerWidth) {
        return;
    }
    currentWidth = window.innerWidth;
    $scope.tile_size();

});

}]);


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, cell, tile, sRotate) {
    $scope.cell = cell;
    $scope.tile = tile;
    $scope.hasVictims = (cell.tile.victims.top != "None") ||
        (cell.tile.victims.right != "None") ||
        (cell.tile.victims.bottom != "None") ||
        (cell.tile.victims.left != "None");
    $scope.clickSound = function(){
        playSound(sClick);
    }
    $scope.incKits = function (direction) {
        playSound(sClick);
        $scope.tile.scoredItems.rescueKits[direction]++;
    }

    $scope.decKits = function (direction) {
        playSound(sClick);
        $scope.tile.scoredItems.rescueKits[direction]--;
        if ($scope.tile.scoredItems.rescueKits[direction] < 0) {
            $scope.tile.scoredItems.rescueKits[direction] = 0;
        }
    }

    $scope.lightStatus = function(light, kit){
        if(light) return true;
        if(kit > 0) return true;
        return false;
    }

    $scope.kitStatus = function(light, kit, type){
        switch(type){
                case 'Heated':
                    if(kit >= 1) return true;
                    break;
                case 'H':
                    if(kit >= 2) return true;
                    break;
                case 'S':
                    if(kit >= 1) return true;
                    break;
                case 'U':
                    if(light || kit > 0) return true;
                    break;
        }
        return false;
    }

    $scope.modalRotate = function(dir){
        var ro;
        switch(dir){
            case 'top':
                ro = 0;
                break;
            case 'right':
                ro = 90;
                break;
            case 'left':
                ro = 270;
                break;
            case 'bottom':
                ro = 180;
                break;
        }
        ro += sRotate;
        if(ro >= 360)ro -= 360;
        switch(ro){
            case 0:
                return 'top';
            case 90:
                return 'right';
            case 180:
                return 'bottom';
            case 270:
                return 'left';
        }
    }

    $scope.ok = function () {
        playSound(sClick);
        $uibModalInstance.close();
    };

});





let lastTouch = 0;
document.addEventListener('touchend', event => {
    const now = window.performance.now();
    if (now - lastTouch <= 500) {
        event.preventDefault();
    }
    lastTouch = now;
}, true);

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var getAudioBuffer = function(url, fn) {
  var req = new XMLHttpRequest();
  req.responseType = 'arraybuffer';

  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 0 || req.status === 200) {
        context.decodeAudioData(req.response, function(buffer) {
          fn(buffer);
        });
      }
    }
  };

  req.open('GET', url, true);
  req.send('');
};

var playSound = function(buffer) {
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
};

var sClick,sInfo,sError,sTimeup;
window.onload = function() {
  getAudioBuffer('/sounds/click.mp3', function(buffer) {
      sClick = buffer;
  });
  getAudioBuffer('/sounds/info.mp3', function(buffer) {
      sInfo = buffer;
  });
  getAudioBuffer('/sounds/error.mp3', function(buffer) {
      sError = buffer;
  });
  getAudioBuffer('/sounds/timeup.mp3', function(buffer) {
      sTimeup = buffer;
  });
};
