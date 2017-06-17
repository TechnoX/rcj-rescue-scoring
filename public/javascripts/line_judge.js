// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);
var marker={};

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', function($scope, $uibModal, $log, $timeout, $http){



    $scope.z = 0;
    $scope.placedDropTiles = 0;
    $scope.actualUsedDropTiles = 0; // Count droptiles twice that will be passed two times
    $scope.startedScoring = false;
    $scope.startedTime = false;
    $scope.time = 0;
    $scope.processing= new Array();
    $scope.rprocessing = false;
    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        showSelectionBar: true,
        showTicksValues: true
    };


    $scope.tiles = {};
    $scope.marker_place = {};

    $http.get("/api/runs/"+runId+"?populate=true").then(function(response){
        $scope.height = response.data.height;
        $scope.sliderOptions.ceil = $scope.height - 1;
        $scope.width = response.data.width;
        $scope.length = response.data.length;
        width = response.data.width;
        length = response.data.length;
        $scope.team = response.data.team;
        $scope.field = response.data.field;
        $scope.round = response.data.round;
        $scope.competition = response.data.competition;

        $scope.numberOfDropTiles = response.data.numberOfDropTiles;
        $scope.rescuedLiveVictims = response.data.rescuedLiveVictims;
        $scope.rescuedDeadVictims = response.data.rescuedDeadVictims;
        $scope.escapeEvacuationZone = response.data.escapeEvacuationZone;
        $scope.rescueLevel = response.data.rescueLevel;
        for(var i = 0; i < response.data.tiles.length; i++){
            $scope.tiles[response.data.tiles[i].x + ',' +
                         response.data.tiles[i].y + ',' +
                         response.data.tiles[i].z] = response.data.tiles[i];
            if(response.data.tiles[i].scoredItems.dropTiles.length>0){
                $scope.placedDropTiles++;
		        $scope.actualUsedDropTiles += response.data.tiles[i].scoredItems.dropTiles.length;
                for(var j = 0; j < response.data.tiles[i].index.length ; j++){
                    marker[response.data.tiles[i].index[j]] = true;
                }    
	           }
        }
        $scope.tiles[response.data.startTile.x + ',' +
                         response.data.startTile.y + ',' +
                         response.data.startTile.z].start = response.data.showedUp;
        $scope.score = response.data.score;
        $scope.showedUp = response.data.showedUp;
        
        $scope.LoPs = response.data.LoPs;
        $scope.retired = response.data.retired;
        console.log($scope.LoPs)
        // Verified time by timekeeper
        $scope.minutes = response.data.time.minutes;
        $scope.seconds = response.data.time.seconds;
        $scope.time = $scope.minutes * 60 * 1000 + $scope.seconds * 1000;
        console.log($scope.tiles);
        $scope.showtile = true;
        $http.post("/api/runs/"+runId+"/update", {status: 1}).then(function(response){
                
                }, function(response){
                    console.log("Error: " + response.statusText);
            });
    }, function(response){
        console.log("Error: " + response.statusText);
    });
    
    


    $scope.range = function(n){
        arr = [];
        for (var i=0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }
    
    $scope.TimeReset = function(){
        $scope.time = 0;
        $scope.minutes = 0;
        $scope.seconds = 0;
        $scope.retired = false;
        $scope.saveEverything();
    }

    $scope.toggleScoring = function(){
        if($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
            swal("Oops!", "まだ，全てのチェックポイントタイルが設定されていません．チェックポイントタイルを設定してください．", "error");
            return;
        }
        // Start/stop scoring
        $scope.startedScoring = !$scope.startedScoring;
        if(!$scope.startedScoring)
            $scope.saveEverything();
    }
    
    $scope.infochecked = function(){
        $scope.checked = true;
        setTimeout("tile_size()", 10);
        
    }

    $scope.decrement = function(index){
        $scope.processing[index] = true;
        if($scope.LoPs[index])
            $scope.LoPs[index]--;
        else
            $scope.LoPs[index] = 0;
        if($scope.LoPs[index] < 0)
            $scope.LoPs[index] = 0;
        $http.post("/api/runs/"+runId+"/update", {LoPs: $scope.LoPs}).then(function(response){
            console.log(response);
            $scope.score = response.data.score;
            $scope.processing[index] = false;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }
    $scope.increment = function(index,last){
        $scope.processing[index] = true;
        if($scope.LoPs[index])
            $scope.LoPs[index]++;
        else
            $scope.LoPs[index] = 1;
        $http.post("/api/runs/"+runId+"/update", {LoPs: $scope.LoPs}).then(function(response){
            console.log(response);
            $scope.score = response.data.score;
            $scope.processing[index] = false;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
        if($scope.LoPs[index] >= 3 && !last)swal("進行停止回数 > 3", "チームキャプテンは，次のチェックポイントに移動することを選択できます．", "info");
    }
    


    $scope.decVictims = function(type){
        if(type == 'live'){
            $scope.rlprocessing = true;
            $scope.rescuedLiveVictims--;
            if($scope.rescuedLiveVictims <= 0)
                $scope.rescuedLiveVictims = 0;

            $http.post("/api/runs/"+runId+"/update", {rescuedLiveVictims: $scope.rescuedLiveVictims}).then(function(response){
                $scope.score = response.data.score;
                $scope.rlprocessing = false;
            }, function(response){
                console.log("Error: " + response.statusText);
            });
        }else if(type == 'dead'){
            $scope.rdprocessing = true;
            $scope.rescuedDeadVictims--;
            if($scope.rescuedDeadVictims <= 0)
                $scope.rescuedDeadVictims = 0;

            $http.post("/api/runs/"+runId+"/update", {rescuedDeadVictims: $scope.rescuedDeadVictims}).then(function(response){
                $scope.score = response.data.score;
                $scope.rdprocessing = false;
            }, function(response){
                console.log("Error: " + response.statusText);
            });
        }

    }
    $scope.incVictims = function(type){
        if(type == 'live'){
            $scope.rlprocessing = true;
            $scope.rescuedLiveVictims++;
            $http.post("/api/runs/"+runId+"/update", {rescuedLiveVictims: $scope.rescuedLiveVictims}).then(function(response){
                $scope.score = response.data.score;
                $scope.rlprocessing = false;
            }, function(response){
                console.log("Error: " + response.statusText);
            });
        }else if(type == 'dead'){
            $scope.rdprocessing = true;
            $scope.rescuedDeadVictims++;
            $http.post("/api/runs/"+runId+"/update", {rescuedDeadVictims: $scope.rescuedDeadVictims}).then(function(response){
                $scope.score = response.data.score;
                $scope.rdprocessing = false;
            }, function(response){
                console.log("Error: " + response.statusText);
            });
        }

    }

    var tick = function() {
        $scope.time += 1000;
        if($scope.time >= 480000){
            $scope.startedTime = !$scope.startedTime;
            $scope.minutes = Math.floor($scope.time/60000)
            $scope.seconds = (Math.floor($scope.time%60000))/1000
            $scope.saveEverything();
            
            swal("Time Up!", "リタイヤボタンを押さないでください．", "info");
            
        }
        if($scope.startedTime)
            $timeout(tick, 1000);
    }

    $scope.toggleTime = function(){
        // Start/stop timer
        $scope.startedTime = !$scope.startedTime;
        if($scope.startedTime){
            // Start the timer
            $timeout(tick, $scope.tickInterval);
            $http.post("/api/runs/"+runId+"/update", {status: 2}).then(function(response){
                
                }, function(response){
                    console.log("Error: " + response.statusText);
            });
        }else{
            // Save everything when you stop the time
            
            $scope.minutes = Math.floor($scope.time/60000)
            $scope.seconds = (Math.floor($scope.time%60000))/1000
            $scope.saveEverything();
        }
    }


    $scope.totalNumberOf = function(objects){
        return objects.gaps + objects.speedbumps + objects.obstacles + objects.intersections;
    }

    $scope.changeShowedUp = function(){
        $http.post("/api/runs/"+runId+"/update", {showedUp: $scope.showedUp}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    }
    
    $scope.changeRescueLevel = function(){
        console.log('Change Rescue');
        $http.post("/api/runs/"+runId+"/update", {rescueLevel: $scope.rescueLevel}).then(function(response){
            console.log($scope.rescueLevel);
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    }
    
    $scope.changeEscapeEvacuationZone = function(){
        $http.post("/api/runs/"+runId+"/update", {escapeEvacuationZone: $scope.escapeEvacuationZone}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    }

    $scope.doScoring = function(x,y,z){
        var tile = $scope.tiles[x+','+y+','+z];
        // If this is not a created tile
        if(!tile)
            return;


        var total = $scope.totalNumberOf(tile.items);

        // If the run is not started, we can place drop pucks on this tile
        if(!$scope.startedScoring){
            // We can only place drop markers on tiles without scoring elements (rule 3.3.4)
            if($scope.numberOfDropTiles - $scope.placedDropTiles != 0 && tile.index.length == 0 )swal("Oops!", "システム実装上，通過しないタイルをチェックポイントに指定できません．", "error");
            else if($scope.numberOfDropTiles - $scope.placedDropTiles != 0 &&(total > 0 || tile.start != null)){
                swal("Oops!", "得点項目のあるタイルをチェックポイントに指定できません． (ルール 3.3.4　参照)", "error");
            }else{
                
		// If this tile already contains a droptile, we should remove it
		if(tile.scoredItems.dropTiles.length > 0){
                    for(var j = 0; j < tile.index.length ; j++){
                        marker[tile.index[j]] = false;
                    }
                    tile.scoredItems.dropTiles = [];
                    $scope.placedDropTiles--;
		            $scope.actualUsedDropTiles -= tile.index.length;
                    
                }// If this tile doesn't contain a droptile, we should add one, IF we have any left to place
		else if($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
                    tile.scoredItems.dropTiles = [];
                    for(var i = 0; i < tile.index.length; i++){
                        tile.scoredItems.dropTiles.push(false);
                    }
                    $scope.placedDropTiles++;
		            $scope.actualUsedDropTiles += tile.index.length;
                    for(var j = 0; j < tile.index.length ; j++){
                        marker[tile.index[j]] = true;
                    }
                }
                $http.post("/api/runs/"+runId+"/update", {tiles:[tile]}).then(function(response){
                    $scope.score = response.data.score;
                    $scope.showtile = false;
                    setTimeout(function(){$scope.showtile = true;},100);
                    $scope.showtile = true;
                    setTimeout("tile_size()", 10);
                    setTimeout("tile_size()", 500);
                }, function(response){
                    console.log("Error: " + response.statusText);
                });
            }

        // Match has started!
        }else{
            // Add the number of possible passes for drop tiles
            if(tile.scoredItems.dropTiles.length > 0) {
                total += tile.scoredItems.dropTiles.length;
            }
            
            if(tile.start != null)total ++;

            if(total == 0){
                return;
            }else if(total > 1){
                // Show modal
                tile.processing = true;
                $scope.open(x,y,z);
                // Save data from modal when closing it
            }else if(total==1){
                tile.processing = true;
                if(tile.items.gaps>0)
                    tile.scoredItems.gaps[0] = !tile.scoredItems.gaps[0];
                else if(tile.items.speedbumps)
                    tile.scoredItems.speedbumps[0] = !tile.scoredItems.speedbumps[0];
                else if(tile.items.obstacles)
                    tile.scoredItems.obstacles[0] = !tile.scoredItems.obstacles[0];
                else if(tile.items.intersections)
                    tile.scoredItems.intersections[0] = !tile.scoredItems.intersections[0];
                else if(tile.scoredItems.dropTiles.length > 0)
                    tile.scoredItems.dropTiles[0] = !tile.scoredItems.dropTiles[0];
                else if(tile.start != null){
                    $scope.showedUp = !$scope.showedUp;
                    tile.start = $scope.showedUp;
                }
                $scope.minutes = Math.floor($scope.time/60000)
                $scope.seconds = (Math.floor($scope.time%60000))/1000
                var run = {}
                run.tiles = $scope.tiles;
                run.showedUp = $scope.showedUp;
                run.time = {};
                run.time.minutes = $scope.minutes;
                run.time.seconds = $scope.seconds;
                $http.post("/api/runs/"+runId+"/update", run).then(function(response){
                    $scope.score = response.data.score;
                    tile.processing = false;
                }, function(response){
                    console.log("Error: " + response.statusText);
                });

            }

        }
    }


    $scope.open = function(x,y,z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/line_judge_modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'sm',
            resolve: {
                tile: function () {
                    return $scope.tiles[x+','+y+','+z];
                }
            }
        }).closed.then(function(result){
            console.log("Closed modal");
            $scope.minutes = Math.floor($scope.time/60000)
            $scope.seconds = (Math.floor($scope.time%60000))/1000
            var run = {}
            run.tiles = $scope.tiles;
            run.time = {};
            run.time.minutes = $scope.minutes;;
            run.time.seconds = $scope.seconds;
            $http.post("/api/runs/"+runId+"/update", run).then(function(response){
                $scope.score = response.data.score;
                $scope.tiles[x+','+y+','+z].processing = false;
            }, function(response){
                console.log("Error: " + response.statusText);
            });
        });
    };

    $scope.saveEverything = function(){
        var run = {}
        run.height = $scope.height;
        run.width = $scope.width;
        run.length = $scope.length;
        run.rescuedLiveVictims = $scope.rescuedLiveVictims;
        run.rescuedDeadVictims = $scope.rescuedDeadVictims;
        run.rescueLevel = $scope.rescueLevel;
        run.escapeEvacuationZone = $scope.escapeEvacuationZone;
        run.tiles = $scope.tiles;
        run.showedUp = $scope.showedUp;
        run.LoPs = $scope.LoPs;
        run.time = {};
        run.time.minutes = $scope.minutes;
        run.time.seconds = $scope.seconds;
        run.retired = $scope.retired;

        $http.post("/api/runs/"+runId+"/update", run).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    };
    
    $scope.retire = function(){
        swal({
          title: "Retire?", 
          text: "'YES'をクリックすると，タイム[8:01]として記録されます．（システム上では，リタイヤを8:01として取り扱います．）", 
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes"
        }, function() {
            $scope.startedTime = 0;
            $scope.minutes = 8
            $scope.seconds = 1
            $scope.retired = true;
            $scope.saveEverything();
        });
        

    }

    $scope.confirm = function(){
        if((!$scope.showedUp || $scope.showedUp == null) && $scope.score >0 ){
            swal("Oops!", "獲得得点が1点以上なのに，暗黙のチェックポイントをクリアしていません．", "error");
        }else{
            var run = {}
            run.rescuedLiveVictims = $scope.rescuedLiveVictims;
            run.tiles = $scope.tiles;
            run.showedUp = $scope.showedUp;
            run.LoPs = $scope.LoPs;
            // Verified time by timekeeper
            run.time = {};
            run.time.minutes = $scope.minutes;
            run.time.seconds = $scope.seconds;
            run.status = 3;

            $http.post("/api/runs/"+runId+"/update", run).then(function(response){
                $scope.score = response.data.score;
                $scope.go('/line/sign/'+runId)
            }, function(response){
                console.log("Error: " + response.statusText);
            });
        }
    };
    
    
    $scope.go = function(path){
      window.location = path
    }
    
    
    

}]);


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, tile) {
    $scope.tile = tile;
    $scope.ok = function () {
        $uibModalInstance.close();
    };
});



app.directive('tile', function() {
    return {
        scope: {
            tile: '='
        },
        restrict: 'E',
        templateUrl: '/templates/tile.html',
        link : function($scope, element, attrs){
            $scope.tileNumber = function(tile){
                $scope.tileN = 1;
                var ret_txt="";
                if(!tile)return;
                
                var possible = 0;

                var count = function(list){
                    for(var i = 0; i < list.length; i++){
                        possible++;
                    }
                }
                count(tile.scoredItems.gaps);
                count(tile.scoredItems.speedbumps);
                count(tile.scoredItems.intersections);
                count(tile.scoredItems.obstacles);
                if(tile.start != null)possible++;
                if(possible !=0)return;
                
                for(var i = 0; i < tile.index.length ; i++){
                    if(i!=0)ret_txt += ','
                    ret_txt += tile.index[i]+1;
                }
                return ret_txt;
            }
            $scope.checkpointNumber = function(tile){
                var ret_txt="";
                if(!tile)return;
                for(var i = 0; i < tile.index.length ; i++){
                    if(marker[tile.index[i]]){
                        var count = 0;
                        for(var j = 0; j < tile.index[i]; j++){
                            if(marker[j])count++;
                        }
                        count++;
                        if(i!=0)ret_txt += '&'
                        ret_txt += count;
                    }
                    else{
                        return;
                    }
                }
                return ret_txt;
            }

            $scope.tileStatus = function(tile){
                // If this is a non-existent tile
                if(!tile)
                    return;
                var successfully = 0;
                var possible = 0;

                var count = function(list){
                    for(var i = 0; i < list.length; i++){
                        if(list[i])
                            successfully++;
                        possible++;
                    }
                }
                
                count(tile.scoredItems.gaps);
                count(tile.scoredItems.speedbumps);
                count(tile.scoredItems.intersections);
                count(tile.scoredItems.obstacles);
                if(tile.scoredItems.dropTiles.length > 0)
                    count(tile.scoredItems.dropTiles);
                
                if(tile.processing)return "processing";
                else if((possible > 0 && successfully == possible) || tile.start)
                    return "done";
                else if(successfully > 0)
                    return "halfdone";
                else if(possible > 0 || (tile.start != null && !tile.start))
                    return "undone";
                else
                    return "";
            }

            $scope.rotateRamp = function(direction){
                switch(direction){
                case "bottom":
                    return "rot0";
                case "top":
                    return "rot180";
                case "left":
                    return "rot90";
                case "right":
                    return "rot270";
                }
            }

        }
    };
});


function tile_size(){
        $(function() {
            try{
                var b = $('.tilearea');
                console.log('コンテンツ本体：' + b.height() + '×' + b.width());
                console.log('window：' + window.innerHeight);
                var tilesize_w = ($('.tilearea').width()-50) / width;
                var tilesize_h = (window.innerHeight - 150) / length;
                console.log('tilesize_w:' + tilesize_w);
                console.log('tilesize_h:' + tilesize_h);
                if(tilesize_h > tilesize_w)var tilesize = tilesize_w;
                else var tilesize = tilesize_h;
                $('tile').css('height',tilesize); 
                $('tile').css('width',tilesize);
                $('.tile-image').css('height',tilesize); 
                $('.tile-image').css('width',tilesize); 
                $('.slot').css('height',tilesize); 
                $('.slot').css('width',tilesize); 
                $('.chnumtxt').css('font-size',tilesize/8); 
                
                
                $('#card_area').css('height',(window.innerHeight - 150));
                if(b.height() == 0)setTimeout("tile_size()", 500);
            }
            
            catch(e){
                setTimeout("tile_size()", 500);
            }
          

    });
}

var currentWidth = -1;


             
$(window).on('load resize', function(){
    if (currentWidth == window.innerWidth) {
        return;
    }
    currentWidth = window.innerWidth;
    var height = $('.navbar').height();
    $('body').css('padding-top',height+40); 
    tile_size();
    
    });

let lastTouch = 0;
document.addEventListener('touchend', event => {
  const now = window.performance.now();
  if (now - lastTouch <= 500) {
    event.preventDefault();
  }
  lastTouch = now;
}, true);