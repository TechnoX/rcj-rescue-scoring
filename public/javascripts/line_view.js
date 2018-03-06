// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var marker = {};
var socket;
// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$cookies', function ($scope, $uibModal, $log, $timeout, $http, $cookies) {

    $scope.z = 0;
    // Scoring elements of the tiles
    $scope.stiles = [];
    // Map (images etc.) for the tiles
    $scope.mtiles = [];

    $scope.checkPointDistance = [];

    //$cookies.remove('sRotate')
    if ($cookies.get('sRotate')) {
        $scope.sRotate = Number($cookies.get('sRotate'));
    } else $scope.sRotate = 0;


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

                $scope.checkPointDistance = [];
                let tmp = {
                    dis: 1,
                    status: $scope.showedUp,
                    point: 3 * $scope.showedUp
                }
                $scope.checkPointDistance.push(tmp);
                let prevCheckPoint = 0;
                let j = 0;
                for (let i in $scope.stiles) {
                    if ($scope.stiles[i].isDropTile) {
                        let tmp = {
                            dis: i - prevCheckPoint,
                            status: $scope.stiles[i].scored,
                            point: (i - prevCheckPoint) * $scope.stiles[i].scored * $scope.LoPsCountPoint($scope.LoPs[j])
                        }
                        $scope.checkPointDistance.push(tmp);
                        prevCheckPoint = i;
                        j++;
                    }
                }
                $scope.$apply();
                console.log("Updated view from socket.io");
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

            try {
                $scope.cap_sig = response.data.sign.captain;
                $scope.ref_sig = response.data.sign.referee;
                $scope.refas_sig = response.data.sign.referee_as;

                $scope.comment = response.data.comment;
            } catch (err) {}
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

                $scope.width = response.data.width;
                $scope.length = response.data.length;
                width = response.data.width;
                length = response.data.length;
                $scope.startTile = response.data.startTile;
                $scope.numberOfDropTiles = response.data.numberOfDropTiles;;
                $scope.mtiles = {};
                var ntile = {
                    scored: false,
                    isDropTile: false
                }

                while ($scope.stiles.length < response.data.indexCount) {
                    $scope.stiles.push(ntile);
                }

                for (var i = 0; i < response.data.tiles.length; i++) {
                    $scope.mtiles[response.data.tiles[i].x + ',' +
                        response.data.tiles[i].y + ',' +
                        response.data.tiles[i].z] = response.data.tiles[i];
                }

                $scope.checkPointDistance = [];
                let tmp = {
                    dis: 1,
                    status: $scope.showedUp,
                    point: 3 * $scope.showedUp
                }
                $scope.checkPointDistance.push(tmp);
                let prevCheckPoint = 0;
                let j = 0;
                for (let i in $scope.stiles) {
                    if ($scope.stiles[i].isDropTile) {
                        let tmp = {
                            dis: i - prevCheckPoint,
                            status: $scope.stiles[i].scored,
                            point: (i - prevCheckPoint) * $scope.stiles[i].scored * $scope.LoPsCountPoint($scope.LoPs[j])
                        }
                        $scope.checkPointDistance.push(tmp);
                        prevCheckPoint = i;
                        j++;
                    }
                }

                $timeout($scope.tile_size, 0);
                $timeout($scope.tile_size, 500);
                $timeout($scope.tile_size, 1000);
                $timeout($scope.tile_size, 1500);
                $timeout($scope.tile_size, 3000);

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

    $scope.LoPsCountPoint = function (n) {
        if (n == 0) return 3;
        if (n == 1) return 2;
        if (n == 2) return 1;
        return 0;
    }

    $scope.checkTotal = function () {
        let ret = 0;
        for (let i in $scope.checkPointDistance) {
            ret += $scope.checkPointDistance[i].point;
        }
        return ret;
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
        socket.emit('unsubscribe', 'runs/' + runId);
        window.location = path
    }


    $scope.changeFloor = function (z) {
        $scope.z = z;
        $timeout($scope.tile_size, 100);
    }

    $scope.tileRot = function (r) {
        $scope.sRotate += r;
        if ($scope.sRotate >= 360) $scope.sRotate -= 360;
        else if ($scope.sRotate < 0) $scope.sRotate += 360;
        $timeout($scope.tile_size, 0);

        $cookies.put('sRotate', $scope.sRotate, {
            path: '/'
        });
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
                sRotate: function () {
                    return $scope.sRotate;
                },
                startTile: function () {
                    return $scope.startTile;
                },
                nineTile: function () {
                    var nine = []
                    if ($scope.sRotate == 0) {
                        nine[0] = $scope.mtiles[(x - 1) + ',' + (y - 1) + ',' + z];
                        nine[1] = $scope.mtiles[(x) + ',' + (y - 1) + ',' + z];
                        nine[2] = $scope.mtiles[(x + 1) + ',' + (y - 1) + ',' + z];
                        nine[3] = $scope.mtiles[(x - 1) + ',' + (y) + ',' + z];
                        nine[4] = $scope.mtiles[(x) + ',' + (y) + ',' + z];
                        nine[5] = $scope.mtiles[(x + 1) + ',' + (y) + ',' + z];
                        nine[6] = $scope.mtiles[(x - 1) + ',' + (y + 1) + ',' + z];
                        nine[7] = $scope.mtiles[(x) + ',' + (y + 1) + ',' + z];
                        nine[8] = $scope.mtiles[(x + 1) + ',' + (y + 1) + ',' + z];
                    } else if ($scope.sRotate == 180) {
                        nine[8] = $scope.mtiles[(x - 1) + ',' + (y - 1) + ',' + z];
                        nine[7] = $scope.mtiles[(x) + ',' + (y - 1) + ',' + z];
                        nine[6] = $scope.mtiles[(x + 1) + ',' + (y - 1) + ',' + z];
                        nine[5] = $scope.mtiles[(x - 1) + ',' + (y) + ',' + z];
                        nine[4] = $scope.mtiles[(x) + ',' + (y) + ',' + z];
                        nine[3] = $scope.mtiles[(x + 1) + ',' + (y) + ',' + z];
                        nine[2] = $scope.mtiles[(x - 1) + ',' + (y + 1) + ',' + z];
                        nine[1] = $scope.mtiles[(x) + ',' + (y + 1) + ',' + z];
                        nine[0] = $scope.mtiles[(x + 1) + ',' + (y + 1) + ',' + z];
                    } else if ($scope.sRotate == 90) {
                        nine[2] = $scope.mtiles[(x - 1) + ',' + (y - 1) + ',' + z];
                        nine[5] = $scope.mtiles[(x) + ',' + (y - 1) + ',' + z];
                        nine[8] = $scope.mtiles[(x + 1) + ',' + (y - 1) + ',' + z];
                        nine[1] = $scope.mtiles[(x - 1) + ',' + (y) + ',' + z];
                        nine[4] = $scope.mtiles[(x) + ',' + (y) + ',' + z];
                        nine[7] = $scope.mtiles[(x + 1) + ',' + (y) + ',' + z];
                        nine[0] = $scope.mtiles[(x - 1) + ',' + (y + 1) + ',' + z];
                        nine[3] = $scope.mtiles[(x) + ',' + (y + 1) + ',' + z];
                        nine[6] = $scope.mtiles[(x + 1) + ',' + (y + 1) + ',' + z];
                    } else if ($scope.sRotate == 270) {
                        nine[6] = $scope.mtiles[(x - 1) + ',' + (y - 1) + ',' + z];
                        nine[3] = $scope.mtiles[(x) + ',' + (y - 1) + ',' + z];
                        nine[0] = $scope.mtiles[(x + 1) + ',' + (y - 1) + ',' + z];
                        nine[7] = $scope.mtiles[(x - 1) + ',' + (y) + ',' + z];
                        nine[4] = $scope.mtiles[(x) + ',' + (y) + ',' + z];
                        nine[1] = $scope.mtiles[(x + 1) + ',' + (y) + ',' + z];
                        nine[8] = $scope.mtiles[(x - 1) + ',' + (y + 1) + ',' + z];
                        nine[5] = $scope.mtiles[(x) + ',' + (y + 1) + ',' + z];
                        nine[2] = $scope.mtiles[(x + 1) + ',' + (y + 1) + ',' + z];
                    }
                    return nine;
                }
            }
        }).closed.then(function (result) {
            console.log("Closed modal");
        });
    };

    $scope.tile_size = function () {
        try {
            var b = $('.tilearea');
            //console.log('コンテンツ本体：' + b.height() + '×' + b.width());
            //console.log('window：' + window.innerHeight);
            if ($scope.sRotate % 180 == 0) {
                var tilesize_w = ($('.tilearea').width() - 2 * width) / width;
                var tilesize_h = (window.innerHeight - 110) / length;
            } else {
                var tilesize_w = ($('.tilearea').width() - 2 * length) / length;
                var tilesize_h = (window.innerHeight - 110) / width;
            }

            //console.log('tilesize_w:' + tilesize_w);
            //console.log('tilesize_h:' + tilesize_h);
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
            $('.chnumtxt').css('font-size', tilesize / 8);
            $('.tile-point').css('font-size', tilesize/2 + "px");

            if ($scope.sRotate % 180 == 0) {
                $('#wrapTile').css('width', (tilesize + 3) * width);
            } else {
                $('#wrapTile').css('width', (tilesize + 3) * length);
            }

            $('#card_area').css('height', (window.innerHeight - 60));
            if (b.height() == 0) $timeout($scope.tile_size, 500);
        } catch (e) {
            $timeout($scope.tile_size, 500);
        }
    }


    var currentWidth = -1;


    $(window).on('load resize', function () {
        if (currentWidth == window.innerWidth) {
            return;
        }
        currentWidth = window.innerWidth;
        $scope.tile_size();

    });


}]).directive("tileLoadFinished", function ($timeout) {
    return function (scope, element, attrs) {
        if (scope.$last) {
            $timeout(function () {
                $scope.tile_size();
            }, 0);
            $timeout(function () {
                $scope.tile_size();
            }, 500);
            $timeout(function () {
                $scope.tile_size();
            }, 3000);
        }
    }
});


app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, mtile, stiles, nineTile, sRotate, startTile) {
    $scope.mtile = mtile;
    $scope.sRotate = sRotate;
    $scope.stiles = stiles;
    $scope.nineTile = nineTile;
    $scope.words = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"];
    $scope.next = [];
    for (var i = 0, d; d = mtile.next[i]; i++) {
        var sp = d.split(",");

        if (mtile.x == Number(sp[0]) && mtile.y - 1 == Number(sp[1])) {
            //console.log("TOP");
            switch (sRotate) {
                case 0:
                    $scope.next.top = mtile.index[i];
                    break;
                case 90:
                    $scope.next.right = mtile.index[i];
                    break;
                case 180:
                    $scope.next.bottom = mtile.index[i];
                    break;
                case 270:
                    $scope.next.left = mtile.index[i];
                    break;
            }

        }
        if (mtile.x + 1 == Number(sp[0]) && mtile.y == Number(sp[1])) {
            //console.log("RIGHT");
            switch (sRotate) {
                case 0:
                    $scope.next.right = mtile.index[i];
                    break;
                case 90:
                    $scope.next.bottom = mtile.index[i];
                    break;
                case 180:
                    $scope.next.left = mtile.index[i];
                    break;
                case 270:
                    $scope.next.top = mtile.index[i];
                    break;
            }
        }
        if (mtile.x == Number(sp[0]) && mtile.y + 1 == Number(sp[1])) {
            //console.log("BOTTOM");
            switch (sRotate) {
                case 0:
                    $scope.next.bottom = mtile.index[i];
                    break;
                case 90:
                    $scope.next.left = mtile.index[i];
                    break;
                case 180:
                    $scope.next.top = mtile.index[i];
                    break;
                case 270:
                    $scope.next.right = mtile.index[i];
                    break;
            }
        }
        if (mtile.x - 1 == Number(sp[0]) && mtile.y == Number(sp[1])) {
            //console.log("LEFT");
            switch (sRotate) {
                case 0:
                    $scope.next.left = mtile.index[i];
                    break;
                case 90:
                    $scope.next.top = mtile.index[i];
                    break;
                case 180:
                    $scope.next.right = mtile.index[i];
                    break;
                case 270:
                    $scope.next.bottom = mtile.index[i];
                    break;
            }
        }

    }

    $scope.tilerotate = function (tilerot) {
        console.log(tilerot);
        if (!tilerot) return $scope.sRotate;
        var ro = tilerot + $scope.sRotate;
        if (ro >= 360) ro -= 360;
        else if (ro < 0) ro += 360;
        console.log(ro);
        return ro;
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
        ro += $scope.sRotate;
        if (ro >= 360) ro -= 360;
        else if (ro < 0) ro += 360;
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

app.directive('tile', function () {
    return {
        scope: {
            tile: '='
        },
        restrict: 'E',
        templateUrl: '/templates/tile.html',
        link: function ($scope, element, attrs) {
            $scope.tilerotate = function (tilerot) {
                if (!tilerot) return $scope.$parent.sRotate;
                var ro = tilerot + $scope.$parent.sRotate;
                if (ro >= 360) ro -= 360;
                else if (ro < 0) ro += 360;
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
            
            $scope.tilePoint = function (tile) {
                // If this is a non-existent tile
                if ((!tile || tile.index.length == 0) && !isStart(tile))
                    return ;

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

                for (var i = 0; i < tile.index.length; i++) {
                    if ($scope.$parent.stiles[tile.index[i]].scored) {
                        successfully += tile.items.obstacles*10;
                        successfully += tile.items.speedbumps*5;
                        successfully += tile.tileType.gaps*10;
                        successfully += tile.tileType.intersections*15;
                    }
                }
                return successfully;
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
                if (ro >= 360) ro -= 360;
                else if (ro < 0) ro += 360;
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
