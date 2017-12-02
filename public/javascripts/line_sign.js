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


    $scope.z = 0;
    $scope.sRotate = 0;
    // Scoring elements of the tiles
    $scope.stiles = [];
    // Map (images etc.) for the tiles
    $scope.mtiles = [];


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
            console.log(response.data);
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
            $scope.competition = response.data.competition.name;
            $scope.competition_id = response.data.competition._id;
            $scope.retired = response.data.retired;
            // Verified time by timekeeper
            $scope.minutes = response.data.time.minutes;
            $scope.seconds = response.data.time.seconds;

            $scope.cap_sig = response.data.sign.captain;
            $scope.ref_sig = response.data.sign.referee;
            $scope.refas_sig = response.data.sign.referee_as;

            $scope.comment = response.data.comment;

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
                $timeout($scope.tile_size, 0);
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
    
    $scope.changeFloor = function (z){
        $scope.z = z;
    }
    
    $scope.tileRot = function (r){
        $scope.sRotate += r;
        if($scope.sRotate >= 360)$scope.sRotate -= 360;
        else if($scope.sRotate < 0) $scope.sRotate+= 360;
        $timeout($scope.tile_size, 0);
    }

    $scope.totalNumberOf = function (objects) {
        return objects.gaps + objects.speedbumps + objects.obstacles +
            objects.intersections;
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
                sRotate: function(){
                    return $scope.sRotate;
                },
                startTile: function(){
                    return $scope.startTile;
                },
                nineTile: function () {
                    var nine = []
                    if($scope.sRotate == 0){
                        nine[0] = $scope.mtiles[(x - 1) + ',' + (y - 1) + ',' + z];
                        nine[1] = $scope.mtiles[(x) + ',' + (y - 1) + ',' + z];
                        nine[2] = $scope.mtiles[(x + 1) + ',' + (y - 1) + ',' + z];
                        nine[3] = $scope.mtiles[(x - 1) + ',' + (y) + ',' + z];
                        nine[4] = $scope.mtiles[(x) + ',' + (y) + ',' + z];
                        nine[5] = $scope.mtiles[(x + 1) + ',' + (y) + ',' + z];
                        nine[6] = $scope.mtiles[(x - 1) + ',' + (y + 1) + ',' + z];
                        nine[7] = $scope.mtiles[(x) + ',' + (y + 1) + ',' + z];
                        nine[8] = $scope.mtiles[(x + 1) + ',' + (y + 1) + ',' + z];
                    }else if($scope.sRotate == 180){
                        nine[8] = $scope.mtiles[(x - 1) + ',' + (y - 1) + ',' + z];
                        nine[7] = $scope.mtiles[(x) + ',' + (y - 1) + ',' + z];
                        nine[6] = $scope.mtiles[(x + 1) + ',' + (y - 1) + ',' + z];
                        nine[5] = $scope.mtiles[(x - 1) + ',' + (y) + ',' + z];
                        nine[4] = $scope.mtiles[(x) + ',' + (y) + ',' + z];
                        nine[3] = $scope.mtiles[(x + 1) + ',' + (y) + ',' + z];
                        nine[2] = $scope.mtiles[(x - 1) + ',' + (y + 1) + ',' + z];
                        nine[1] = $scope.mtiles[(x) + ',' + (y + 1) + ',' + z];
                        nine[0] = $scope.mtiles[(x + 1) + ',' + (y + 1) + ',' + z];
                    }else if($scope.sRotate == 90){
                        nine[2] = $scope.mtiles[(x - 1) + ',' + (y - 1) + ',' + z];
                        nine[5] = $scope.mtiles[(x) + ',' + (y - 1) + ',' + z];
                        nine[8] = $scope.mtiles[(x + 1) + ',' + (y - 1) + ',' + z];
                        nine[1] = $scope.mtiles[(x - 1) + ',' + (y) + ',' + z];
                        nine[4] = $scope.mtiles[(x) + ',' + (y) + ',' + z];
                        nine[7] = $scope.mtiles[(x + 1) + ',' + (y) + ',' + z];
                        nine[0] = $scope.mtiles[(x - 1) + ',' + (y + 1) + ',' + z];
                        nine[3] = $scope.mtiles[(x) + ',' + (y + 1) + ',' + z];
                        nine[6] = $scope.mtiles[(x + 1) + ',' + (y + 1) + ',' + z];
                    }else if($scope.sRotate == 270){
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

    $scope.success_message = function () {
        swal({
            title: 'Recorded!',
            text: txt_complete,
            type: 'success'
        }, function () {
            $scope.go("/line/" + $scope.competition_id);
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
            $http.put("/api/runs/line/" + runId, run).then(function (response) {
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
            //console.log('コンテンツ本体：' + b.height() + '×' + b.width());
            //console.log('window：' + window.innerHeight);
            if($scope.sRotate%180 == 0){
                var tilesize_w = ($('.tilearea').width() - 50) / width;
                var tilesize_h = (window.innerHeight - 130) / length;
            }else{
                var tilesize_w = ($('.tilearea').width() - 50) / length;
                var tilesize_h = (window.innerHeight - 130) / width;
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
            
            if($scope.sRotate%180 == 0){
                $('#wrapTile').css('width', (tilesize+3)*width);
            }else{
                $('#wrapTile').css('width', (tilesize+3)*length);
            }

            $('#card_area').css('height', (window.innerHeight - 120));
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
                if (!tile || tile.index.length == 0)
                    return;
                return $scope.$parent.stiles[tile.index[0]].isDropTile;
            }

            function isStart(tile) {
                if (!tile)
                    return;
                return tile.x == $scope.$parent.startTile.x &&
                    tile.y == $scope.$parent.startTile.y &&
                    tile.z == $scope.$parent.startTile.z;
            }

            $scope.isStart = function (tile) {
                if (!tile)
                    return;
                return tile.x == $scope.$parent.startTile.x &&
                    tile.y == $scope.$parent.startTile.y &&
                    tile.z == $scope.$parent.startTile.z;
            }
            $scope.tileStatus = function (tile) {
                // If this is a non-existent tile
                if ((!tile || tile.index.length == 0) && !isStart(tile))
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



app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, mtile, stiles, nineTile, sRotate,startTile) {
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
            switch(sRotate){
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
            switch(sRotate){
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
            switch(sRotate){
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
            switch(sRotate){
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
        if(!tilerot)return $scope.sRotate;
        var ro = tilerot + $scope.sRotate;
        if(ro >= 360)ro -= 360;
        else if(ro < 0) ro+= 360;
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
