// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule', 'pascalprecht.translate', 'ngCookies']);
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

    $scope.visType = "slider";
    $scope.z = 0;

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
                $scope.retired = data.retired;
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
                //console.log(response.data);
                $scope.LoPs = response.data.LoPs;
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
                $scope.league = response.data.team.league;
                $scope.competition = response.data.competition.name;
                $scope.competition_id = response.data.competition._id;
                $scope.retired = response.data.retired;
                // Verified time by timekeeper
                $scope.minutes = response.data.time.minutes;
                $scope.seconds = response.data.time.seconds;
                
                try{
                    $scope.cap_sig = response.data.sign.captain;
                    $scope.ref_sig = response.data.sign.referee;
                    $scope.refas_sig = response.data.sign.referee_as;

                    $scope.comment = response.data.comment;
                }catch(err){}
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
                if (response.status == 401) {
                    $scope.go('/home/access_denied');
                }
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
    };


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


app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, mtile, stiles, nineTile) {
    $scope.mtile = mtile;
    console.log(mtile);
    $scope.stiles = stiles;
    $scope.nineTile = nineTile;
    $scope.words = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"];
    $scope.next = [];
    for (var i = 0, d; d = mtile.next[i]; i++) {
        var sp = d.split(",");
        console.log(sp);

        if (mtile.x == Number(sp[0]) && mtile.y - 1 == Number(sp[1])) {
            console.log("TOP");
            $scope.next.top = mtile.index[i];
        }
        if (mtile.x + 1 == Number(sp[0]) && mtile.y == Number(sp[1])) {
            console.log("RIGHT");
            $scope.next.right = mtile.index[i];
        }
        if (mtile.x == Number(sp[0]) && mtile.y + 1 == Number(sp[1])) {
            console.log("BOTTOM");
            $scope.next.bottom = mtile.index[i];
        }
        if (mtile.x - 1 == Number(sp[0]) && mtile.y == Number(sp[1])) {
            console.log("LEFT");
            $scope.next.left = mtile.index[i];
        }
        console.log($scope.next);

    }


    $scope.ok = function () {
        $uibModalInstance.close();
    };
});

app.directive('tile', function () {
    return {
        scope: {
            tile: '='
        },
        restrict: 'E',
        templateUrl: '/templates/tile.html',
        link: function ($scope, element, attrs) {
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
                switch (direction) {
                    case "bottom":
                        return;
                    case "top":
                        return "fa-rotate-180";
                    case "left":
                        return "fa-rotate-90";
                    case "right":
                        return "fa-rotate-270";
                }
            }

        }
    };
});

function tile_size() {
    $(function () {
        try {
            var b = $('.tilearea');
            console.log('コンテンツ本体：' + b.height() + '×' + b.width());
            console.log('window：' + window.innerHeight);
            var tilesize_w = ($('.tilearea').width() - 50) / width;
            var tilesize_h = (window.innerHeight - 130) / length;
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
            $('#card_area').css('height', (window.innerHeight - 80));
            $('.chnumtxt').css('font-size', tilesize / 6);
            if (b.height() == 0) setTimeout("tile_size()", 500);
        } catch (e) {
            setTimeout("tile_size()", 500);
        }


    });
}


var currentWidth = -1;

$(window).on('load resize', function () {
    if (currentWidth == window.innerWidth) {
        return;
    }
    currentWidth = window.innerWidth;
    var height = $('.navbar').height();
    $('body').css('padding-top', height + 40);
    tile_size();

});
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
