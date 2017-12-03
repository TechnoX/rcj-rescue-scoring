// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap']);
var marker = {};
var socket;
// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', function ($scope, $uibModal, $log, $timeout, $http) {
    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        showSelectionBar: true,
        showTicksValues: true
    };
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


    if (typeof runId !== 'undefined') {
        loadNewRun();
    }

    (function launchSocketIo() {
        // launch socket.io
        socket = io(window.location.origin, {
            transports: ['websocket']
        });
        if (typeof runId !== 'undefined') {
            $scope.actualUsedDropTiles = 0;
            socket.emit('subscribe', 'runs/' + runId);

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

        if (typeof fieldIds !== 'undefined') {
            console.log(fieldIds);
            var fields = fieldIds.split(',');
            for (var i = 0; i < fields.length; i++) {
                socket.emit('subscribe', 'fields/' + fields[i]);
            }
            socket.on('data', function (data) {
                //                if(typeof runId === 'undefined') || runId != data.newRun){ // TODO: FIX!
                console.log("Judge changed to a new run");
                runId = data.newRun;
                loadNewRun();
                //                }
            });


        }

    })();


    function loadNewRun() {
        $http.get("/api/runs/line/" + runId +
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
                    marker[i] = true;
                }
            }

            // Get the map
            $http.get("/api/maps/line/" + response.data.map +
                "?populate=true").then(function (response) {
                console.log(response.data);

                $scope.height = response.data.height;
                $scope.sliderOptions.ceil = $scope.height - 1;
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
