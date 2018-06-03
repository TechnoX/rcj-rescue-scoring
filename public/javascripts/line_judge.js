// register the directive with your app module
var app = angular.module('ddApp', ['ngTouch', 'ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var marker = {};

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$translate', '$cookies', function ($scope, $uibModal, $log, $timeout, $http, $translate, $cookies) {

    var db_mtile;
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


    $scope.sync = 0;

    $scope.z = 0;
    $scope.placedDropTiles = 0;
    $scope.actualUsedDropTiles = 0; // Count droptiles twice that will be passed two times
    $scope.startedScoring = false;
    $scope.startedTime = false;
    $scope.time = 0;
    $scope.startUnixTime = 0;


    $scope.victim_list = [];
    $scope.victim_tmp = [];
    $scope.LoPs = [];

    $scope.checkTeam = $scope.checkRound = $scope.checkMember = $scope.checkMachine = false;
    $scope.toggleCheckTeam = function () {
        $scope.checkTeam = !$scope.checkTeam;
        playSound(sClick);
    }
    $scope.toggleCheckRound = function () {
        $scope.checkRound = !$scope.checkRound;
        playSound(sClick);
    }
    $scope.toggleCheckMember = function () {
        $scope.checkMember = !$scope.checkMember;
        playSound(sClick);
    }
    $scope.toggleCheckMachine = function () {
        $scope.checkMachine = !$scope.checkMachine;
        playSound(sClick);
    }
    $scope.checks = function () {
        return ($scope.checkTeam & $scope.checkRound & $scope.checkMember & $scope.checkMachine)
    }

    const http_config = {
        timeout: 1000
    };
    
    var tileReset = true;

    function upload_run(data) {
        let tmp = {
            map: {
                tiles: db_mtile
            },
            tiles: $scope.stiles,
            LoPs: $scope.LoPs,
            rescueOrder: $scope.victim_list,
            evacuationLevel: $scope.evacuationLevel,
            exitBonus: $scope.exitBonus,
            showedUp: $scope.showedUp
        };
        $scope.score = line_calc_score(tmp);


        if ($scope.networkError) {
            $scope.saveEverything();
            return;
        }

        $scope.sync++;
        $http.put("/api/runs/line/" + runId, Object.assign(data, {
            time: {
                minutes: Math.floor($scope.time / 60000),
                seconds: (Math.floor($scope.time % 60000)) / 1000
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

    var date = new Date();
    var prevTime = 0;



    //$cookies.remove('sRotate')
    if ($cookies.get('sRotate')) {
        $scope.sRotate = Number($cookies.get('sRotate'));
    } else $scope.sRotate = 0;



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
    } else {
        let data = {
            status: 1
        };
        upload_run(data);
    }

    function loadNewRun() {
        $http.get("/api/runs/line/" + runId +
            "?populate=true").then(function (response) {

            $scope.LoPs = response.data.LoPs;
            $scope.evacuationLevel = response.data.evacuationLevel;
            $scope.exitBonus = response.data.exitBonus;
            $scope.field = response.data.field.name;
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
            $scope.time = ($scope.minutes * 60 + $scope.seconds) * 1000;
            prevTime = $scope.time;
            
            var started = response.data.started;

            $scope.victim_list = response.data.rescueOrder;


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
                console.log(response);
                $scope.height = response.data.height;

                $scope.width = response.data.width;
                $scope.length = response.data.length;
                width = response.data.width;
                length = response.data.length;
                $scope.startTile = response.data.startTile;
                $scope.numberOfDropTiles = response.data.numberOfDropTiles;
                $scope.mtiles = {};
                
                // Get max victim count
                $scope.maxLiveVictims = response.data.victims.live;
                $scope.maxDeadVictims = response.data.victims.dead;
                
                $scope.mapIndexCount = response.data.indexCount;

                var flag = false;
                var sItem = {
                    item: "",
                    scored: false
                };
                var ntile = {
                    scoredItems:[],
                    isDropTile: false
                }
                
                console.log(started);
                
                if(!started && tileReset){
                    
                    $scope.stiles = [];
                    tileReset = false;
                }
                if($scope.stiles.length < response.data.indexCount){
                    while ($scope.stiles.length < response.data.indexCount) {
                        $scope.stiles.push({
                            scoredItems:[],
                            isDropTile: false
                        });
                        flag = true;
                    }
                    console.log($scope.stiles);
                    for(let i=0,t;t=response.data.tiles[i];i++){
                        for(let j=0;j<t.index.length;j++){
                            //console.log(t.items.obstacles);
                            for(let k=0;k<t.items.obstacles;k++){
                                let addSItem = {
                                    item: "obstacle",
                                    scored: false
                                };
                                $scope.stiles[t.index[j]].scoredItems.push(addSItem);
                            }
                            
                            for(let k=0;k<t.items.speedbumps;k++){
                                let addSItem = {
                                    item: "speedbump",
                                    scored: false
                                };
                                $scope.stiles[t.index[j]].scoredItems.push(addSItem);
                            }
                            
                            if(t.items.rampPoints){
                                let addSItem = {
                                    item: "ramp",
                                    scored: false
                                };
                                $scope.stiles[t.index[j]].scoredItems.push(addSItem);
                            }
                            
                            for(let k=0;k<t.tileType.gaps;k++){
                                let addSItem = {
                                    item: "gap",
                                    scored: false
                                };
                                $scope.stiles[t.index[j]].scoredItems.push(addSItem);
                            }
                            
                            for(let k=0;k<t.tileType.intersections;k++){
                                let addSItem = {
                                    item: "intersection",
                                    scored: false
                                };
                                $scope.stiles[t.index[j]].scoredItems.push(addSItem);
                            }
                        }
                        
                    }
                    
                    for(let i=0; i < $scope.stiles.length-2;i++){
                        if($scope.stiles[i].scoredItems.length == 0 || $scope.stiles[i].scoredItems[0].item == "ramp"){
                            let addSItem = {
                                        item: "checkpoint",
                                        scored: false
                            };
                            $scope.stiles[i].scoredItems.push(addSItem);
                        }
                    }
                }
                
                console.log($scope.stiles);
                
                if (flag) {
                    $scope.sync++;
                    $http.put("/api/runs/line/" + runId, {
                        tiles: $scope.stiles
                    }, http_config).then(function (response) {
                        console.log("Run Score Tileset Updated")
                        loadNewRun();
                        $scope.sync--;
                    }, function (response) {
                        console.log("Error: " + response.statusText);
                        if (response.status == 401) {
                            $scope.go('/home/access_denied');
                        }
                        $scope.networkError = true;
                    });
                    return;
                }

                db_mtile = response.data.tiles;
                for (var i = 0; i < response.data.tiles.length; i++) {
                    $scope.mtiles[response.data.tiles[i].x + ',' +
                        response.data.tiles[i].y + ',' +
                        response.data.tiles[i].z] = response.data.tiles[i];
                    
                    if ($scope.stiles[response.data.tiles[i].index[0]] &&
                        $scope.stiles[response.data.tiles[i].index[0]].isDropTile) {
                        $scope.placedDropTiles++;
                    }
                }
                console.log($scope.mtiles)

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

    $scope.TimeReset = function () {
        playSound(sClick);
        prevTime = 0;
        $scope.time = 0;
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
        //$timeout($scope.tile_size, 10);
        $timeout($scope.tile_size, 200);
        $timeout($scope.tile_size, 2000);
        scrollTo(0, 0);
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

    $scope.decrement = function (index) {
        playSound(sClick);
        if ($scope.LoPs[index])
            $scope.LoPs[index]--;
        else
            $scope.LoPs[index] = 0;
        if ($scope.LoPs[index] < 0)
            $scope.LoPs[index] = 0;

        upload_run({
            LoPs: $scope.LoPs
        });
    }
    $scope.increment = function (index, last) {
        playSound(sClick);
        if ($scope.LoPs[index])
            $scope.LoPs[index]++;
        else
            $scope.LoPs[index] = 1;

        upload_run({
            LoPs: $scope.LoPs
        });
        if ($scope.LoPs[index] >= 3 && !last) {
            playSound(sInfo);
            swal(txt_lops, txt_lops_mes, "info");
        }

    }


    $scope.calc_victim_points = function (type, effective) {
        let tmp_point = 0;
        if (!effective) tmp_point = 5;
        else if ($scope.evacuationLevel == 1) { // Low Level
            if (type == "L") tmp_point = 30;
            else tmp_point = 20;
        } else { // High Level
            if (type == "L") tmp_point = 40;
            else tmp_point = 30;
        }
        return Math.max(tmp_point - $scope.LoPs[$scope.actualUsedDropTiles] * 5, 0);
    }

    $scope.count_victim_list = function (type) {
        let count = 0
        for (victiml of $scope.victim_list) {
            if (!victiml.type.indexOf(type)) {
                count++;
            }
        }
        return count;
    }

    $scope.count_victim_tmp = function (type) {
        let count = 0
        for (victiml of $scope.victim_tmp) {
            if (!victiml.indexOf(type)) {
                count++;
            }
        }
        return count;
    }

    $scope.addVictimTmp = function (type) {
        playSound(sClick);
        if (type == "L") {
            if ($scope.count_victim_list("L") + $scope.count_victim_tmp("L") >= $scope.maxLiveVictims) return;
        } else {
            if ($scope.count_victim_list("D") + $scope.count_victim_tmp("D") >= $scope.maxDeadVictims) return;
        }
        $scope.victim_tmp.push(type);
    }

    $scope.addVictim = function (type) {
        let tmp = {};
        tmp.effective = true;
        if (type == "L") {
            tmp.type = "L";
            if ($scope.count_victim_list("L") >= $scope.maxLiveVictims) return;
        } else {
            tmp.type = "D";
            if ($scope.count_victim_list("D") >= $scope.maxDeadVictims) return;
            if ($scope.count_victim_list("L") >= $scope.maxLiveVictims) { // All live victims rescued

            } else {
                tmp.effective = false;
            }
        }


        $scope.victim_list.push(tmp);
    }

    function reStateVictim() {
        let count = 0;
        for (victiml of $scope.victim_list) {
            if (!victiml.type.indexOf("L")) {
                count++;
            }
            if (!victiml.type.indexOf("D")) {
                if (count >= $scope.maxLiveVictims) {
                    victiml.effective = true;
                } else {
                    victiml.effective = false;
                }
            }

        }
    }

    $scope.delete_victim = function (index) {
        playSound(sClick);
        $scope.victim_list.splice(index, 1);
        reStateVictim();

        upload_run({
            rescueOrder: $scope.victim_list
        });

    }
    $scope.delete_victim_tmp = function (index) {
        playSound(sClick);
        $scope.victim_tmp.splice(index, 1);
    }

    $scope.victimRegist = function () {
        playSound(sClick);
        let live = 0;
        let dead = 0;
        for (victiml of $scope.victim_tmp) {
            if (!victiml.indexOf("L")) {
                live++;
            } else {
                dead++;
            }
        }
        for (let i = 0; i < dead; i++) {
            $scope.addVictim("D");
        }
        for (let i = 0; i < live; i++) {
            $scope.addVictim("L");
        }
        $scope.victim_tmp_clear();

        upload_run({
            rescueOrder: $scope.victim_list
        });
    }

    $scope.victim_tmp_clear = function () {
        playSound(sClick);
        $scope.victim_tmp = [];
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


    $scope.totalNumberOf = function (objects) {
        return objects.gaps + objects.speedbumps + objects.obstacles +
            objects.intersections;
    }

    $scope.changeShowedUp = function () {
        playSound(sClick);

        upload_run({
            showedUp: $scope.showedUp
        });


    }
    $scope.changeExitBonus = function () {
        playSound(sClick);
        $scope.exitBonus = !$scope.exitBonus
        if ($scope.exitBonus && $scope.startedTime) {
            $scope.startedTime = false
            date = new Date();
            $scope.time = prevTime + (date.getTime() - $scope.startUnixTime);
            prevTime = $scope.time;
            $scope.minutes = Math.floor($scope.time / 60000)
            $scope.seconds = Math.floor(($scope.time % 60000) / 1000)
        }

        upload_run({
            exitBonus: $scope.exitBonus
        });


    }
    $scope.changeLevel = function (n) {
        playSound(sClick);
        $scope.evacuationLevel = n;

        upload_run({
            evacuationLevel: $scope.evacuationLevel
        });

    }

    $scope.doScoring = function (x, y, z) {
        var mtile = $scope.mtiles[x + ',' + y + ',' + z];
        var stile = [];
        var stileIndex = [];
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
            stileIndex.push(mtile.index[i]);
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
                    if(stileIndex[i] < $scope.mapIndexCount-2){
                        // If this tile already contains a droptile, we should remove it
                        if (stile[i].isDropTile) {
                            stile[i].isDropTile = false;
                            stile[i].scoredItems[0].scored = false;
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
                    
                }

                if (placed) {
                    $scope.placedDropTiles++;
                } else if (removed) {
                    $scope.placedDropTiles--;
                }
                console.log(httpdata);
                upload_run(httpdata);

            }

            // Match has started!
        } else {
            // Add the number of possible passes for drop tiles
            if (isDropTile) {
                for(let i=0;i<stile.length;i++){
                    if(stileIndex[i] < $scope.mapIndexCount-2){
                        total ++;
                    }
                }
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
                $scope.open(x, y, z);
                // Save data from modal when closing it
            } else if (total == 1) {
                console.log(stile)
                if(stile[0].scoredItems.length == 1){
                    stile[0].scoredItems[0].scored = !stile[0].scoredItems[0].scored;
                    httpdata.tiles[mtile.index[0]] = stile[0];
                    $scope.stiles[mtile.index[0]] = stile[0];
                    
                    upload_run(httpdata);
                }else{
                    var selectableHtml = "";
                    function itemPreCheck(item){
                        if(item.scored) return "checked";
                        return "";
                    }
                    for(let i=0; i<stile[0].scoredItems.length;i++){
                        selectableHtml += '<input type="checkbox" id="element'+ i +'" ' + itemPreCheck(stile[0].scoredItems[i]) + '><label class="checkbox" for="element'+ i +'" onclick="playSound(sClick)"> '+  stile[0].scoredItems[i].item +'</label><br>'
                    }
                    async function getFormValues () {
                        const {value: formValues} = await swal({
                          title: 'Multiple elements',
                          html:selectableHtml
                            ,
                          focusConfirm: false,
                          preConfirm: () => {
                            playSound(sClick);
                            switch(stile[0].scoredItems.length){
                                case 2: return [
                                          document.getElementById('element0').checked,
                                          document.getElementById('element1').checked
                                        ]
                                case 3: return [
                                          document.getElementById('element0').checked,
                                          document.getElementById('element1').checked,
                                          document.getElementById('element2').checked
                                        ]
                                case 4: return [
                                          document.getElementById('element0').checked,
                                          document.getElementById('element1').checked,
                                          document.getElementById('element2').checked,
                                          document.getElementById('element3').checked
                                        ]
                                case 5: return [
                                          document.getElementById('element0').checked,
                                          document.getElementById('element1').checked,
                                          document.getElementById('element2').checked,
                                          document.getElementById('element3').checked,
                                          document.getElementById('element4').checked
                                        ]
                                case 6: return [
                                          document.getElementById('element0').checked,
                                          document.getElementById('element1').checked,
                                          document.getElementById('element2').checked,
                                          document.getElementById('element3').checked,
                                          document.getElementById('element4').checked,
                                          document.getElementById('element5').checked
                                        ]
                                case 7: return [
                                          document.getElementById('element0').checked,
                                          document.getElementById('element1').checked,
                                          document.getElementById('element2').checked,
                                          document.getElementById('element3').checked,
                                          document.getElementById('element4').checked,
                                          document.getElementById('element5').checked,
                                          document.getElementById('element6').checked
                                        ]
                                case 8:  return [
                                          document.getElementById('element0').checked,
                                          document.getElementById('element1').checked,
                                          document.getElementById('element2').checked,
                                          document.getElementById('element3').checked,
                                          document.getElementById('element4').checked,
                                          document.getElementById('element5').checked,
                                          document.getElementById('element6').checked,
                                          document.getElementById('element7').checked
                                        ]
                            }
                          }
                        })

                        if (formValues) {
                          for(let i=0;i<formValues.length;i++){
                              $scope.stiles[mtile.index[0]].scoredItems[i].scored = formValues[i];
                          }
                            httpdata.tiles[mtile.index[0]] = $scope.stiles[mtile.index[0]];
                            console.log(httpdata);
                            $scope.$apply();
                            upload_run(httpdata);
                        }
                    }

                    getFormValues();
                    
                }
                

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
            upload_run({
                tiles: $scope.stiles
            });
        });
    };

    $scope.saveEverything = function () {
        var run = {}
        run.LoPs = $scope.LoPs;
        run.evacuationLevel = $scope.evacuationLevel;
        run.exitBonus = $scope.exitBonus;
        run.rescueOrder = $scope.victim_list;
        run.showedUp = $scope.showedUp;
        run.started = $scope.started;
        run.rescueOrder = $scope.victim_list;
        run.tiles = $scope.stiles;
        $scope.minutes = Math.floor($scope.time / 60000)
        $scope.seconds = Math.floor(($scope.time % 60000) / 1000)
        run.retired = $scope.retired;
        run.time = {
            minutes: $scope.minutes,
            seconds: $scope.seconds
        };
        $scope.sync++;
        $http.put("/api/runs/line/" + runId, run, http_config).then(function (response) {
            $scope.score = response.data.score;
            $scope.sync--;
            $scope.networkError = false;
            $scope.sync = 0;
        }, function (response) {
            console.log("Error: " + response.statusText);
            $scope.networkError = true;
        });
        //console.log("Update run", run);



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


    $scope.handover = function () {
        var run = {}
        run.LoPs = $scope.LoPs;
        run.evacuationLevel = $scope.evacuationLevel;
        run.exitBonus = $scope.exitBonus;
        run.rescueOrder = $scope.victim_list;
        run.showedUp = $scope.showedUp;
        run.started = $scope.started;
        run.rescueOrder = $scope.victim_list;
        run.tiles = $scope.stiles;
        $scope.minutes = Math.floor($scope.time / 60000)
        $scope.seconds = Math.floor(($scope.time % 60000) / 1000)
        run.retired = $scope.retired;
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

    $scope.confirm = function () {
        if ((!$scope.showedUp || $scope.showedUp == null) && $scope.score > 0) {
            playSound(sError);
            swal("Oops!", txt_implicit, "error");
        } else {
            playSound(sClick);
            var run = {}
            run.LoPs = $scope.LoPs;
            run.evacuationLevel = $scope.evacuationLevel;
            run.exitBonus = $scope.exitBonus;
            run.rescueOrder = $scope.victim_list;
            run.showedUp = $scope.showedUp;
            run.started = $scope.started;
            run.rescueOrder = $scope.victim_list;
            run.tiles = $scope.stiles;
            $scope.minutes = Math.floor($scope.time / 60000)
            $scope.seconds = Math.floor(($scope.time % 60000) / 1000)
            run.retired = $scope.retired;
            run.time = {
                minutes: $scope.minutes,
                seconds: $scope.seconds
            };
            run.status = 3;


            $scope.sync++;
            $http.put("/api/runs/line/" + runId, run, http_config).then(function (response) {
                $scope.score = response.data.score;
                $scope.sync--;
                $scope.go('/line/sign/' + runId + '?return=' + $scope.getParam('return'));
            }, function (response) {
                console.log("Error: " + response.statusText);
                $scope.networkError = true;
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
            $('.tile-font-1-25').css('font-size', tilesize / 3);
            $('.slot').css('height', tilesize);
            $('.slot').css('width', tilesize);
            $('.chnumtxt').css('font-size', tilesize / 6);

            if ($scope.sRotate % 180 == 0) {
                $('#wrapTile').css('width', (tilesize + 3) * width);
            } else {
                $('#wrapTile').css('width', (tilesize + 3) * length);
            }

            $('#card_area').css('height', (window.innerHeight - 130));
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



// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, $timeout, mtile, stiles, nineTile, sRotate, startTile) {
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
        //console.log($scope.next);

    }
    
    $scope.dirStatus = function (tile) {
        if(tile.scoredItems.length == 0) return;

        // Number of successfully passed times
        var successfully = 0;
        // Number of times it is possible to pass this tile
        var possible = tile.scoredItems.length;

        for(let j = 0; j < tile.scoredItems.length;j++){
            if(tile.scoredItems[j].scored){
                successfully++;
            }
        }

        if (possible > 0 && successfully == possible)
            return "done";
        else if (successfully > 0)
            return "halfdone";
        else if (possible > 0)
            return "undone";
        else
            return "";
    }

    $scope.toggle_scored = function (num) {
        playSound(sClick);
        try {
            if($scope.stiles[num].scoredItems.length == 1){
                $scope.stiles[num].scoredItems[0].scored = !$scope.stiles[num].scoredItems[0].scored;
                $timeout($uibModalInstance.close, 300);
            }else{
                var selectableHtml = "";
                function itemPreCheck(item){
                    if(item.scored) return "checked";
                    return "";
                }
                for(let i=0; i<$scope.stiles[num].scoredItems.length;i++){
                    selectableHtml += '<input type="checkbox" id="element'+ i +'" ' + itemPreCheck($scope.stiles[num].scoredItems[i]) + '><label class="checkbox" for="element'+ i +'" onclick="playSound(sClick)"> '+ $scope.stiles[num].scoredItems[i].item +'</label><br>'
                }
                async function getFormValues () {
                    const {value: formValues} = await swal({
                      title: 'Multiple elements',
                      html:selectableHtml
                        ,
                      focusConfirm: false,
                      preConfirm: () => {
                        playSound(sClick);
                        switch($scope.stiles[num].scoredItems.length){
                            case 2: return [
                                      document.getElementById('element0').checked,
                                      document.getElementById('element1').checked
                                    ]
                            case 3: return [
                                      document.getElementById('element0').checked,
                                      document.getElementById('element1').checked,
                                      document.getElementById('element2').checked
                                    ]
                            case 4: return [
                                      document.getElementById('element0').checked,
                                      document.getElementById('element1').checked,
                                      document.getElementById('element2').checked,
                                      document.getElementById('element3').checked
                                    ]
                            case 5: return [
                                      document.getElementById('element0').checked,
                                      document.getElementById('element1').checked,
                                      document.getElementById('element2').checked,
                                      document.getElementById('element3').checked,
                                      document.getElementById('element4').checked
                                    ]
                            case 6: return [
                                      document.getElementById('element0').checked,
                                      document.getElementById('element1').checked,
                                      document.getElementById('element2').checked,
                                      document.getElementById('element3').checked,
                                      document.getElementById('element4').checked,
                                      document.getElementById('element5').checked
                                    ]
                            case 7: return [
                                      document.getElementById('element0').checked,
                                      document.getElementById('element1').checked,
                                      document.getElementById('element2').checked,
                                      document.getElementById('element3').checked,
                                      document.getElementById('element4').checked,
                                      document.getElementById('element5').checked,
                                      document.getElementById('element6').checked
                                    ]
                            case 8:  return [
                                      document.getElementById('element0').checked,
                                      document.getElementById('element1').checked,
                                      document.getElementById('element2').checked,
                                      document.getElementById('element3').checked,
                                      document.getElementById('element4').checked,
                                      document.getElementById('element5').checked,
                                      document.getElementById('element6').checked,
                                      document.getElementById('element7').checked
                                    ]
                        }
                      }
                    })

                    if (formValues) {
                      for(let i=0;i<formValues.length;i++){
                          $scope.stiles[num].scoredItems[i].scored = formValues[i];
                      }  
                      $scope.$apply();
                      $timeout($uibModalInstance.close, 300);
                    }
                }

                getFormValues();
            }
            //$scope.stiles[num].scored = !$scope.stiles[num].scored;
            
        } catch (e) {

        }

    }


    $scope.tilerotate = function (tilerot) {
        //console.log(tilerot);
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
                        if (ret_txt != "") ret_txt += '&'
                        ret_txt += count;
                    } else {
                        return ret_txt;
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
                    !tile.items.rampPoints &&
                    tile.tileType.gaps == 0 &&
                    tile.tileType.intersections == 0 &&
                    !$scope.$parent.stiles[tile.index[0]].isDropTile && !isStart(tile)
                ) {
                    return;
                }

                // Number of successfully passed times
                var successfully = 0;
                // Number of times it is possible to pass this tile
                var possible = 0;
                
                for(let i=0;i<tile.index.length;i++){
                    possible += $scope.$parent.stiles[tile.index[i]].scoredItems.length;
                }

                for (var i = 0; i < tile.index.length; i++) {
                    for(let j = 0; j < $scope.$parent.stiles[tile.index[i]].scoredItems.length;j++){
                        if($scope.$parent.stiles[tile.index[i]].scoredItems[j].scored){
                            successfully++;
                        }
                    }
                }

                if ((possible > 0 && successfully == possible) ||
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
    getAudioBuffer('/sounds/timeup.mp3', function (buffer) {
        sTimeup = buffer;
    });
};
