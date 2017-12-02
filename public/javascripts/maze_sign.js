// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule', 'pascalprecht.translate', 'ngCookies']);
var marker = {};
var socket;

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$translate', function ($scope, $uibModal, $log, $timeout, $http, $translate) {
    var txt_cap_sign, txt_cref_sign, txt_ref_sign, txt_no_sign, txt_complete, txt_confirm;
    $translate('line.sign.cap_sign').then(function (val) {
        txt_cap_sign = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.sign.ref_sign').then(function (val) {
        txt_ref_sign = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.sign.cref_sign').then(function (val) {
        txt_cref_sign = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.sign.no_sign').then(function (val) {
        txt_no_sign = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.sign.complete').then(function (val) {
        txt_complete = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.sign.confirm').then(function (val) {
        txt_confirm = val;
    }, function (translationId) {
        // = translationId;
    });

    $scope.visType = "slider";
    $scope.countWords = ["Bottom", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Ninth"];
    $scope.z = 0;

    $scope.cells = {};
    $scope.tiles = {};
    
    $scope.sRotate = 0;

    if (typeof runId !== 'undefined') {
        $scope.runId = runId;
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
            $scope.competition = response.data.competition.name;
            $scope.competition_id = response.data.competition._id;
            $scope.LoPs = response.data.LoPs;

            // Verified time by timekeeper
            $scope.minutes = response.data.time.minutes;
            $scope.seconds = response.data.time.seconds;

            $scope.cap_sig = response.data.sign.captain;
            $scope.ref_sig = response.data.sign.referee;
            $scope.refas_sig = response.data.sign.referee_as;

            $scope.comment = response.data.comment;

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
                $scope.slider = {
                    options : {
                        floor: 0,
                        ceil: $scope.height - 1,
                        step: 1,
                        showTicksValues: true
                    }
                };
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
    
    $scope.changeFloor = function (z){
        $scope.z = z;
    }
    
    $scope.tileRot = function (r){
        $scope.sRotate += r;
        if($scope.sRotate >= 360)$scope.sRotate -= 360;
        else if($scope.sRotate < 0) $scope.sRotate+= 360;
        $timeout($scope.tile_size, 0);
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


    $scope.go = function (path) {
        socket.emit('unsubscribe', 'runs/' + runId);
        window.location = path
    }


    $scope.success_message = function () {
        swal({
            title: 'Recorded!',
            text: txt_complete,
            type: 'success'
        }, function () {
            $scope.go("/maze/" + $scope.competition_id);
        });
        console.log("Success!!");
    }

    $scope.send_sign = function () {
        var sign_empty = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4="
        var run = {}
        run.comment = $scope.comment;
        run.sign = {}
        var err_mes = ""
        var datapair = $("#cap_sig").jSignature("getData", "svgbase64")
        if (datapair[1] == sign_empty) {
            err_mes += "[" + txt_cap_sign + "] "
        } else {
            run.sign.captain = "data:" + datapair[0] + "," + datapair[1]
        }

        var datapair = $("#ref_sig").jSignature("getData", "svgbase64")
        if (datapair[1] == sign_empty) {
            err_mes += "[" + txt_ref_sign + "] "
        } else {
            run.sign.referee = "data:" + datapair[0] + "," + datapair[1]
        }

        var datapair = $("#refas_sig").jSignature("getData", "svgbase64")
        if (datapair[1] == sign_empty) {
            err_mes += "[" + txt_cref_sign + "] "
        } else {
            run.sign.referee_as = "data:" + datapair[0] + "," + datapair[1]
        }


        if (err_mes != "") {
            swal("Oops!", err_mes + txt_no_sign, "error");
            return;
        }

        swal({
            title: "Finish Run?",
            text: txt_confirm,
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, finish it!",
            confirmButtonColor: "#ec6c62"
        }, function () {
            console.log("STATUS UPDATED(4)")
            run.status = 4;
            $http.put("/api/runs/maze/" + runId, run).then(function (response) {
                setTimeout($scope.success_message, 500);
            }, function (response) {
                swal("Oops", "We couldn't connect to the server! Please notice to system manager.", "error");
                console.log("Error: " + response.statusText);
            });

        });


    }
    
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
    $timeout($scope.tile_size, 500);
    $timeout($scope.tile_size, 3000);

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
});


let lastTouch = 0;
document.addEventListener('touchend', event => {
    const now = window.performance.now();
    if (now - lastTouch <= 500) {
        event.preventDefault();
    }
    lastTouch = now;
}, true);
