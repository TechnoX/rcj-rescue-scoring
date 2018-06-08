// register the directive with your app module
var app = angular.module('ddApp', ['ngTouch','ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var marker = {};

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$translate', '$cookies', function ($scope, $uibModal, $log, $timeout, $http, $translate, $cookies) {

    var txt_score_element, txt_not_yet, txt_timeup, txt_timeup_mes, txt_lops, txt_lops_mes, txt_cantvisit, txt_start, txt_implicit;
    $translate('line.judge.js.score_element').then(function (val) {
        txt_score_element = val;
    }, function (translationId) {
        // = translationId;
    });

    
    $translate('line.judge.js.cantvisit').then(function (val) {
        txt_cantvisit = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.judge.js.start').then(function (val) {
        txt_start = val;
    }, function (translationId) {
        // = translationId;
    });



    $scope.z = 0;
    $scope.placedDropTiles = 0;
    $scope.actualUsedDropTiles = 0; // Count droptiles twice that will be passed two times

    $scope.processing = new Array();
    $scope.rprocessing = false;
    
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

    //$cookies.remove('sRotate')
    if ($cookies.get('sRotate')) {
        $scope.sRotate = Number($cookies.get('sRotate'));
    } else $scope.sRotate = 0;



    // Scoring elements of the tiles
    $scope.stiles = [];
    // Map (images etc.) for the tiles
    $scope.mtiles = [];

    function loadNewRun() {
        $http.get("/api/runs/line/" + runId +
            "?populate=true").then(function (response) {

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
            $scope.team = response.data.team;
            $scope.league = response.data.team.league;
            $scope.competition = response.data.competition;
            $scope.retired = response.data.retired;
            // Verified time by timekeeper
            $scope.minutes = response.data.time.minutes;
            $scope.seconds = response.data.time.seconds;
            $scope.time = ($scope.minutes * 60 + $scope.seconds)*1000;
            prevTime = $scope.time;

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

                $scope.height = response.data.height;

                $scope.width = response.data.width;
                $scope.length = response.data.length;
                width = response.data.width;
                length = response.data.length;
                $scope.startTile = response.data.startTile;
                $scope.numberOfDropTiles = response.data.numberOfDropTiles;;
                $scope.mtiles = {};
                var flag = false;
                var ntile = {
                    scored: false,
                    isDropTile: false
                }
                while ($scope.stiles.length < response.data.indexCount) {
                    $scope.stiles.push(ntile);
                    flag = true;
                }
                if (flag) {
                    $http.put("/api/runs/line/" + runId, {
                        tiles: $scope.stiles
                    }).then(function (response) {
                        console.log("Run Score Tileset Updated")
                        loadNewRun();
                    }, function (response) {
                        console.log("Error: " + response.statusText);
                        if (response.status == 401) {
                            $scope.go('/home/access_denied');
                        }
                    });
                    return;
                }
                for (var i = 0; i < response.data.tiles.length; i++) {
                    $scope.mtiles[response.data.tiles[i].x + ',' +
                        response.data.tiles[i].y + ',' +
                        response.data.tiles[i].z] = response.data.tiles[i];
                    if ($scope.stiles[response.data.tiles[i].index[0]] &&
                        $scope.stiles[response.data.tiles[i].index[0]].isDropTile) {
                        $scope.placedDropTiles++;
                    }
                }

                $timeout($scope.tile_size, 0);
                $timeout($scope.tile_size, 500);
                //$timeout($scope.tile_size, 1000);
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

    loadNewRun();


    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.infochecked = function () {
        playSound(sClick);
        $scope.checked = true;
        //$timeout($scope.tile_size, 10);
        $timeout($scope.tile_size, 200);
        $timeout($scope.tile_size, 2000);
        scrollTo( 0, 0 ) ;
    }

    $scope.changeFloor = function (z) {
        playSound(sClick);
        $scope.z = z;
    }

    $scope.tileRot = function (r) {
        playSound(sClick);
        $scope.sRotate += r;
        if ($scope.sRotate >= 360) $scope.sRotate -= 360;
        else if ($scope.sRotate < 0) $scope.sRotate += 360;
        $timeout($scope.tile_size, 0);

        $cookies.put('sRotate', $scope.sRotate, {
            path: '/'
        });
    }


    $scope.totalNumberOf = function (objects) {
        return objects.gaps + objects.speedbumps + objects.obstacles +
            objects.intersections;
    }

    
    $scope.doScoring = function (x, y, z) {
        var mtile = $scope.mtiles[x + ',' + y + ',' + z];
        var stile = [];
        var isDropTile = false;
        var httpdata = {
            tiles: {}
        };

        // If this is not a created tile
        if (!mtile || mtile.index.length == 0)
            return;
        playSound(sClick);
        for (var i = 0; i < mtile.index.length; i++) {
            stile.push($scope.stiles[mtile.index[i]]);
            if ($scope.stiles[mtile.index[i]].isDropTile) {
                isDropTile = true;
            }
        }


        // $scope.totalNumberOf(tile.items);
        var total = (mtile.items.obstacles > 0 ||
            mtile.items.speedbumps > 0 ||
            mtile.tileType.gaps > 0 ||
            mtile.tileType.intersections > 0) * mtile.index.length;

            // We can only place drop markers on tiles without scoring elements (rule 3.3.5)
            if (mtile.index.length == 0) {
                playSound(sError);
                swal("Oops!", txt_cantvisit, "error");
            } else if (total > 0) {
                playSound(sError);
                swal("Oops!", txt_score_element, "error");
            } else if (mtile.x == $scope.startTile.x &&
                mtile.y == $scope.startTile.y &&
                mtile.z == $scope.startTile.z) {
                playSound(sError);
                swal("Oops!", txt_start, "error");
            } else {
                var placed = false;
                var removed = false;

                for (var i = 0; i < stile.length; i++) {
                    // If this tile already contains a droptile, we should remove it
                    if (stile[i].isDropTile) {
                        stile[i].isDropTile = false;
                        stile[i].scored = false;
                        $scope.actualUsedDropTiles--;
                        marker[mtile.index[i]] = false;
                        removed = true;
                    } // If this tile doesn't contain a droptile, we should add one, IF we have any left to place
                    else if ($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
                        stile[i].isDropTile = true;
                        $scope.actualUsedDropTiles++;
                        marker[mtile.index[i]] = true;
                        placed = true;
                    }
                }

                if (placed) {
                    $scope.placedDropTiles++;
                } else if (removed) {
                    $scope.placedDropTiles--;
                }
                

            }

          
    }


   

    $scope.quit_setting = function () {
        playSound(sClick);
        var run = {};
        run.tiles = $scope.stiles;
        run.status = 0;
        console.log("Update run", run);
        $http.put("/api/runs/line/" + runId, run).then(function (response) {
            //$scope.score = response.data.score;
            //console.log("Run updated, got score: ", $scope.score);
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
        playSound(sInfo);
        swal({
                title: "チェックポイントの設定を終了",
                text: "競技開始 ５分前には競技フィールド周辺にてお待ちください．万一，本番で，ここで設定したチェックポイントの場所と違う場所にチェックポイントを設定した場合，副審がシステムに入力するまで得点走行の開始を待ってもらいます．その際，タイマーは止めません．",
                type: "info",
                showCancelButton: false,
                confirmButtonText: "確認",
                confirmButtonColor: "#ec6c62"
            }).then((result) => {
                if (result.value) {
                    $http.get("/api/kiosk/1/NA").then(function (response) {
                        
                    }, function (response) {
                        console.log("Error: " + response.statusText);
                    });
                }
            })
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

    function isStart(tile) {
        if (!tile)
            return;
        return tile.x == $scope.startTile.x &&
            tile.y == $scope.startTile.y &&
            tile.z == $scope.startTile.z;
    }

    $scope.tile_size = function () {
        try {
            var b = $('.tilearea');
            //console.log('コンテンツ本体：' + b.height() + '×' + b.width());
            //console.log('window：' + window.innerHeight);
            if ($scope.sRotate % 180 == 0) {
                var tilesize_w = ($('.tilearea').width() - 2 * width) / width;
                var tilesize_h = (window.innerHeight - 130) / length;
            } else {
                var tilesize_w = ($('.tilearea').width() - 2 * length) / length;
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

            if ($scope.sRotate % 180 == 0) {
                $('#wrapTile').css('width', (tilesize + 3) * width);
            } else {
                $('#wrapTile').css('width', (tilesize + 3) * length);
            }

            $('#card_area').css('height', (window.innerHeight - 60));
            //if (b.height() == 0) $timeout($scope.tile_size, 500);
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
                if (!tile || tile.index.length == 0)
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

var getAudioBuffer = function (url, fn) {
    var req = new XMLHttpRequest();
    req.responseType = 'arraybuffer';

    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            if (req.status === 0 || req.status === 200) {
                context.decodeAudioData(req.response, function (buffer) {
                    fn(buffer);
                });
            }
        }
    };

    req.open('GET', url, true);
    req.send('');
};

var playSound = function (buffer) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
};

var sClick, sInfo, sError, sTimeup;
window.onload = function () {
    getAudioBuffer('/sounds/click.mp3', function (buffer) {
        sClick = buffer;
    });
    getAudioBuffer('/sounds/info.mp3', function (buffer) {
        sInfo = buffer;
    });
    getAudioBuffer('/sounds/error.mp3', function (buffer) {
        sError = buffer;
    });
};
