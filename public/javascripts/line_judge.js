// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var marker = {};

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$translate', '$cookies', function ($scope, $uibModal, $log, $timeout, $http, $translate, $cookies) {

    var txt_score_element, txt_not_yet, txt_timeup, txt_timeup_mes, txt_lops, txt_lops_mes, txt_cantvisit, txt_start, txt_implicit;
    $translate('line.judge.js.score_element').then(function (val) {
        txt_score_element = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.judge.js.not_yet').then(function (val) {
        txt_not_yet = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.judge.js.timeup.title').then(function (val) {
        txt_timeup = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.judge.js.timeup.content').then(function (val) {
        txt_timeup_mes = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.judge.js.lops.title').then(function (val) {
        txt_lops = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.judge.js.lops.content').then(function (val) {
        txt_lops_mes = val;
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
    $translate('line.judge.js.implicit').then(function (val) {
        txt_implicit = val;
    }, function (translationId) {
        // = translationId;
    });



    $scope.z = 0;
    $scope.placedDropTiles = 0;
    $scope.actualUsedDropTiles = 0; // Count droptiles twice that will be passed two times
    $scope.startedScoring = false;
    $scope.startedTime = false;
    $scope.time = 0;
    $scope.processing = new Array();
    $scope.rprocessing = false;

    //$cookies.remove('sRotate')
    if($cookies.get('sRotate')){
        $scope.sRotate = Number($cookies.get('sRotate'));
    }
    else $scope.sRotate = 0;
    


    // Scoring elements of the tiles
    $scope.stiles = [];
    // Map (images etc.) for the tiles
    $scope.mtiles = [];

    if (document.referrer.indexOf('sign') != -1) {
        $scope.checked = true;
        $scope.startedScoring = true;
        $scope.fromSign = true;
        $timeout($scope.tile_size, 10);
        $timeout($scope.tile_size, 200);
    }

    function loadNewRun(){
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
            $scope.team = response.data.team.name;
            $scope.league = response.data.team.league;
            $scope.competition = response.data.competition;
            $scope.retired = response.data.retired;
            // Verified time by timekeeper
            $scope.minutes = response.data.time.minutes;
            $scope.seconds = response.data.time.seconds;
            $scope.time = $scope.minutes * 60 * 1000 + $scope.seconds * 1000;

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
                        scored : false,
                        isDropTile : false
                }
                while($scope.stiles.length < response.data.tiles.length){
                    $scope.stiles.push(ntile);
                    flag = true;
                }
                if(flag){
                    $http.put("/api/runs/line/" + runId, {
                        tiles : $scope.stiles
                    }).then(function (response) {
                        console.log("Run Tileset Updated")
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
                $timeout($scope.tile_size, 1000);
                $timeout($scope.tile_size, 1500);
                $timeout($scope.tile_size, 3000);
                $http.put("/api/runs/line/" + runId, {
                    status: 1
                    //tiles : $scope.stiles
                }).then(function (response) {

                }, function (response) {
                    console.log("Error: " + response.statusText);
                    if (response.status == 401) {
                        $scope.go('/home/access_denied');
                    }
                });


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

    $scope.TimeReset = function () {
        playSound(sClick);
        $scope.time = 0;
        $scope.minutes = 0;
        $scope.seconds = 0;
        $scope.retired = false;
        $scope.saveEverything();
    }

    $scope.toggleScoring = function () {
        if ($scope.numberOfDropTiles - $scope.placedDropTiles > 0 && !$scope.startedScoring) {
            playSound(sError);
            swal("Oops!", txt_not_yet, "error");
            return;
        }
        playSound(sClick);
        // Start/stop scoring
        var i;
        for (i = $scope.LoPs.length; i < $scope.actualUsedDropTiles + 1; i++) {
            $scope.LoPs.push(0);
        }
        $scope.startedScoring = !$scope.startedScoring;
        $scope.saveEverything();
    }

    $scope.infochecked = function () {
        playSound(sClick);
        $scope.checked = true;
        $timeout($scope.tile_size, 10);
        $timeout($scope.tile_size, 500);

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
        $timeout($scope.tile_size, 0);
        
        $cookies.put('sRotate', $scope.sRotate, {
          path: '/'
        });
    }

    $scope.decrement = function (index) {
        playSound(sClick);
        $scope.processing[index] = true;
        if ($scope.LoPs[index])
            $scope.LoPs[index]--;
        else
            $scope.LoPs[index] = 0;
        if ($scope.LoPs[index] < 0)
            $scope.LoPs[index] = 0;
        $http.put("/api/runs/line/" + runId, {
            LoPs: $scope.LoPs,
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
        }).then(function (response) {
            console.log(response);
            $scope.score = response.data.score;
            $scope.processing[index] = false;
        }, function (response) {
            console.log("Error: " + response.statusText);
        });

    }
    $scope.increment = function (index, last) {
        playSound(sClick);
        $scope.processing[index] = true;
        if ($scope.LoPs[index])
            $scope.LoPs[index]++;
        else
            $scope.LoPs[index] = 1;
        $http.put("/api/runs/line/" + runId, {
            LoPs: $scope.LoPs,
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
        }).then(function (response) {
            console.log(response);
            $scope.score = response.data.score;
            $scope.processing[index] = false;
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
        if ($scope.LoPs[index] >= 3 &&!last){
            playSound(sInfo);
            swal(txt_lops, txt_lops_mes, "info");
        }
    }

    $scope.decVictims = function (type) {
        playSound(sClick);
        if (type == 'live') {
            $scope.rlprocessing = true;
            $scope.rescuedLiveVictims--;
            if ($scope.rescuedLiveVictims <= 0)
                $scope.rescuedLiveVictims = 0;

            $http.put("/api/runs/line/" + runId, {
                rescuedLiveVictims: $scope.rescuedLiveVictims,
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            }).then(function (response) {
                $scope.score = response.data.score;
                $scope.rlprocessing = false;
            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        } else if (type == 'dead') {
            $scope.rdprocessing = true;
            $scope.rescuedDeadVictims--;
            if ($scope.rescuedDeadVictims <= 0)
                $scope.rescuedDeadVictims = 0;

            $http.put("/api/runs/line/" + runId, {
                rescuedDeadVictims: $scope.rescuedDeadVictims,
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            }).then(function (response) {
                $scope.score = response.data.score;
                $scope.rdprocessing = false;
            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        }
    }

    $scope.incVictims = function (type) {
        playSound(sClick);
        if (type == 'live') {
            $scope.rlprocessing = true;
            $scope.rescuedLiveVictims++;
            $http.put("/api/runs/line/" + runId, {
                rescuedLiveVictims: $scope.rescuedLiveVictims,
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            }).then(function (response) {
                $scope.score = response.data.score;
                $scope.rlprocessing = false;
            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        } else if (type == 'dead') {
            $scope.rdprocessing = true;
            $scope.rescuedDeadVictims++;
            $http.put("/api/runs/line/" + runId, {
                rescuedDeadVictims: $scope.rescuedDeadVictims,
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            }).then(function (response) {
                $scope.score = response.data.score;
                $scope.rdprocessing = false;
            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        }
    }

    var tick = function () {
        $scope.time += 1000;
        if ($scope.time >= 480000) {
            playSound(sTimeup);
            $scope.startedTime = !$scope.startedTime;
            $scope.minutes = Math.floor($scope.time / 60000)
            $scope.seconds = (Math.floor($scope.time % 60000)) / 1000
            $scope.saveEverything();
            swal(txt_timeup, txt_timeup_mes, "info");
        }
        if ($scope.startedTime) {
            $timeout(tick, 1000);
        }
    }

    $scope.toggleTime = function () {
        playSound(sClick);
        // Start/stop timer
        $scope.startedTime = !$scope.startedTime;
        if ($scope.startedTime) {
            // Start the timer
            $timeout(tick, $scope.tickInterval);
            $http.put("/api/runs/line/" + runId, {
                status: 2,
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            }).then(function (response) {

            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        } else {
            // Save everything when you stop the time
            $scope.minutes = Math.floor($scope.time / 60000)
            $scope.seconds = (Math.floor($scope.time % 60000)) / 1000
            $scope.saveEverything();
        }
    }


    $scope.totalNumberOf = function (objects) {
        return objects.gaps + objects.speedbumps + objects.obstacles +
            objects.intersections;
    }

    $scope.changeShowedUp = function () {
        playSound(sClick);
        $http.put("/api/runs/line/" + runId, {
            showedUp: $scope.showedUp,
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
        }).then(function (response) {
            $scope.score = response.data.score;
        }, function (response) {
            console.log("Error: " + response.statusText);
        });

    }
    $scope.changeExitBonus = function () {
        playSound(sClick);
        $scope.exitBonus = !$scope.exitBonus
        $scope.exitBonusP = true
        $http.put("/api/runs/line/" + runId, {
            exitBonus: $scope.exitBonus,
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
        }).then(function (response) {
            $scope.score = response.data.score;
            $scope.exitBonusP = false
        }, function (response) {
            console.log("Error: " + response.statusText);
        });

    }
    $scope.changeLevel = function (n) {
        playSound(sClick);
        $scope.evacuationLevel = n;
        $http.put("/api/runs/line/" + runId, {
            evacuationLevel: $scope.evacuationLevel,
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
        }).then(function (response) {
            $scope.score = response.data.score;
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    }

    $scope.doScoring = function (x, y, z) {
        var mtile = $scope.mtiles[x + ',' + y + ',' + z];
        var stile = [];
        var isDropTile = false;
        var httpdata = {
            tiles: {},
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
            }
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

        // If the run is not started, we can place drop pucks on this tile
        if (!$scope.startedScoring) {
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
                    httpdata.tiles[mtile.index[i]] = stile[i];
                }

                if (placed) {
                    $scope.placedDropTiles++;
                } else if (removed) {
                    $scope.placedDropTiles--;
                }
                console.log(httpdata);
                $http.put("/api/runs/line/" +
                    runId, httpdata).then(function (response) {
                    $scope.score = response.data.score;
                    $timeout($scope.tile_size, 10);
                    $timeout($scope.tile_size, 500);
                }, function (response) {
                    console.log("Error: " + response.statusText);
                });

            }

            // Match has started!
        } else {
            // Add the number of possible passes for drop tiles
            if (isDropTile) {
                total += stile.length;
            }


            if (isStart(mtile)) {
                $scope.showedUp = !$scope.showedUp;
                $scope.changeShowedUp();
                return;
            }

            if (total == 0) {
                return;
            } else if (total > 1) {
                // Show modal
                mtile.processing = true;
                $scope.open(x, y, z);
                // Save data from modal when closing it
            } else if (total == 1) {
                mtile.processing = true;

                for (var i = 0; i < stile.length; i++) {
                    stile[i].scored = !stile[i].scored;
                    httpdata.tiles[mtile.index[i]] = stile[i];
                }
                console.log(httpdata);
                $http.put("/api/runs/line/" +
                    runId, httpdata).then(function (response) {
                    $scope.score = response.data.score;
                    mtile.processing = false;
                }, function (response) {
                    console.log("Error: " + response.statusText);
                });
            }
        }
    }


    $scope.open = function (x, y, z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/line_judge_modal.html',
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
            $http.put("/api/runs/line/" + runId, {
                tiles: $scope.stiles,
                time: {
                    minutes: Math.floor($scope.time / 60000),
                    seconds: (Math.floor($scope.time % 60000)) / 1000
                }
            }).then(function (response) {
                $scope.score = response.data.score;
                $scope.mtiles[x + ',' + y + ',' + z].processing = false;
            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        });
    };

    $scope.saveEverything = function () {
        var run = {}
        run.LoPs = $scope.LoPs;
        run.evacuationLevel = $scope.evacuationLevel;
        run.exitBonus = $scope.exitBonus;
        run.rescuedDeadVictims = $scope.rescuedDeadVictims;
        run.rescuedLiveVictims = $scope.rescuedLiveVictims;
        run.showedUp = $scope.showedUp;
        run.started = $scope.started;
        run.tiles = $scope.stiles;
        run.time = {
            minutes: $scope.minutes,
            seconds: $scope.seconds
        };
        run.retired = $scope.retired;
        console.log("Update run", run);
        $http.put("/api/runs/line/" + runId, run).then(function (response) {
            $scope.score = response.data.score;
            console.log("Run updated, got score: ", $scope.score);
        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    };

    /*$scope.retire = function () {
        swal({
            title: "Retire?",
            text: "Are you sure to Retire?",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes"
        }, function () {
            $scope.startedTime = false;
            $scope.minutes = 8
            $scope.seconds = 0 //1 (<-- FOR JAPANOPEN)
            $scope.retired = true;
            $scope.saveEverything();
        });
    }*/

    $scope.confirm = function () {
        if ((!$scope.showedUp || $scope.showedUp == null) && $scope.score > 0) {
            playSound(sError);
            swal("Oops!", txt_implicit, "error");
        } else {
            playSound(sClick);
            var run = {}
            run.rescuedDeadVictims = $scope.rescuedDeadVictims;
            run.rescuedLiveVictims = $scope.rescuedLiveVictims;
            run.tiles = $scope.stiles;
            run.showedUp = $scope.showedUp;
            run.LoPs = $scope.LoPs;
            // Verified time by timekeeper
            run.time = {};
            run.time.minutes = $scope.minutes;
            run.time.seconds = $scope.seconds;
            run.status = 3;

            $http.put("/api/runs/line/" + runId, run).then(function (response) {
                $scope.score = response.data.score;
                $scope.go('/line/sign/' + runId + '?return=' + $scope.getParam('return'));
            }, function (response) {
                console.log("Error: " + response.statusText);
            });
        }
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

}]);



// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, mtile, stiles, nineTile, sRotate,startTile) {
    $scope.mtile = mtile;
    $scope.sRotate = sRotate;
    console.log(mtile);
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
        //console.log($scope.next);

    }

    $scope.toggle_scored = function (num) {
        playSound(sClick);
        try {
            $scope.stiles[num].scored = !$scope.stiles[num].scored;
        } catch (e) {

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
        playSound(sClick);
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
