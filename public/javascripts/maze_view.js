// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var socket;
// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$cookies', function ($scope, $uibModal, $log, $timeout, $http, $cookies) {

    $scope.z = 0;

    $scope.countWords = ["Bottom", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Ninth"];


    $scope.cells = {};
    $scope.tiles = {};
    
     //$cookies.remove('sRotate')
    if($cookies.get('sRotate')){
        $scope.sRotate = Number($cookies.get('sRotate'));
    }
    else $scope.sRotate = 0;
    
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
                $scope.exitBonus = data.exitBonus;
                $scope.score = data.score;
                $scope.LoPs = data.LoPs;

                // Verified time by timekeeper
                $scope.minutes = data.time.minutes;
                $scope.seconds = data.time.seconds;

                // Scoring elements of the tiles
                for (var i = 0; i < data.tiles.length; i++) {
                    $scope.tiles[data.tiles[i].x + ',' +
                        data.tiles[i].y + ',' +
                        data.tiles[i].z] = data.tiles[i];
                }
                $scope.$apply();
                console.log("Updated view from socket.io");
            });
            
            socket.emit('subscribe', 'runs/map/' + runId);
            socket.on('mapChange', function (data) {
                $scope.getMap(data.newMap._id);
            });
        }

    })();


    function loadNewRun() {
        $http.get("/api/runs/maze/" + runId +
            "?populate=true").then(function (response) {

            $scope.exitBonus = response.data.exitBonus;
            $scope.field = response.data.field.name;
            $scope.round = response.data.round.name;
            $scope.score = response.data.score;
            $scope.team = response.data.team.name;
            $scope.league = response.data.team.league;
            $scope.competition = response.data.competition.name;
            $scope.competition_id = response.data.competition._id;
            $scope.LoPs = response.data.LoPs;

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
            for (var i = 0; i < response.data.tiles.length; i++) {
                $scope.tiles[response.data.tiles[i].x + ',' +
                    response.data.tiles[i].y + ',' +
                    response.data.tiles[i].z] = response.data.tiles[i];
            }

            // Get the map
            $scope.getMap(response.data.map);
            

        }, function (response) {
            console.log("Error: " + response.statusText);
            if (response.status == 401) {
                $scope.go('/home/access_denied');
            }
        });
    }
    
    $scope.getMap = function(mapId){
        $http.get("/api/maps/maze/" + mapId +
                "?populate=true").then(function (response) {
                $scope.startTile = response.data.startTile;
                $scope.height = response.data.height;
                
                $scope.width = response.data.width;
                $scope.length = response.data.length;

                for (var i = 0; i < response.data.cells.length; i++) {
                    $scope.cells[response.data.cells[i].x + ',' +
                        response.data.cells[i].y + ',' +
                        response.data.cells[i].z] = response.data.cells[i];
                }

                width = response.data.width;
                length = response.data.length;
                $timeout($scope.tile_size, 0);
                $timeout($scope.tile_size, 3000);

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
    
    $scope.changeFloor = function (z){
        $scope.z = z;
    }
    
    $scope.tileRot = function (r){
        $scope.sRotate += r;
        if($scope.sRotate >= 360)$scope.sRotate -= 360;
        else if($scope.sRotate < 0) $scope.sRotate+= 360;
        $timeout($scope.tile_size, 0);
        
        $cookies.put('sRotate', $scope.sRotate, {
          path: '/'
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
        socket.emit('subscribe', 'runs/map/' + runId);
        window.location = path
    }

    $scope.open = function (x, y, z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/maze_view_modal.html',
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
            console.log("Closed modal");
        });
    };
    
    $scope.tile_size = function () {
        try {
            var b = $('.tilearea');
            
            if($scope.sRotate%180 == 0){
                var tilesize_w = (b.width() - (20 + 11 * (width + 1))) / width;
                var tilesize_h = (window.innerHeight - (130 + 11 * (length + 1))) /length;
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
            $('.tile-font').css('font-size', tilesize - 10);
            if (b.height() == 0) $timeout($scope.tile_size, 500);
            
            if($scope.sRotate%180 == 0){
                $('#wrapTile').css('width', (tilesize+10)*width+11);
            }else{
                $('#wrapTile').css('width', (tilesize+10)*length+11);
            }
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



}]);


app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, cell, tile, sRotate) {
    $scope.cell = cell;
    $scope.tile = tile;
    $scope.hasVictims = (cell.tile.victims.top != "None") ||
        (cell.tile.victims.right != "None") ||
        (cell.tile.victims.bottom != "None") ||
        (cell.tile.victims.left != "None");
    
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
        $uibModalInstance.close();
    };
});


$(window).on('beforeunload', function () {
    socket.emit('unsubscribe', 'runs/' + runId);
    socket.emit('subscribe', 'runs/map/' + runId);
});

let lastTouch = 0;
document.addEventListener('touchend', event => {
    const now = window.performance.now();
    if (now - lastTouch <= 500) {
        event.preventDefault();
    }
    lastTouch = now;
}, true);
