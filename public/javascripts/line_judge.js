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
    $scope.startTime = 0;
    $scope.time = 0;
    $scope.processing= new Array();
    $scope.rprocessing = false;
    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        showSelectionBar: true,
        showTicksValues: true
    };

    // Scoring elements of the tiles
    $scope.stiles = [];
    // Map (images etc.) for the tiles
    $scope.mtiles = [];
    
    $http.get("/api/runs/line/"+runId+"?populate=true").then(function(response){

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
        $scope.retired = response.data.retired;
	// Verified time by timekeeper
        $scope.minutes = response.data.time.minutes;
        $scope.seconds = response.data.time.seconds;
	$scope.time = $scope.minutes * 60 * 1000 + $scope.seconds * 1000;

	// Scoring elements of the tiles
        $scope.stiles = response.data.tiles;
        $scope.showtile = true;	
        for(var i = 0; i < response.data.tiles.length; i++){
            if(response.data.tiles[i].isDropTile){
                $scope.placedDropTiles++;
                $scope.actualUsedDropTiles += 1;//response.data.tiles[i].scoredItems.dropTiles.length;
	    }
        }

	// Get the map
        $http.get("/api/maps/line/" + response.data.map + "?populate=true").then(function(response){
	    console.log(response.data);

	    $scope.height = response.data.height;
            $scope.sliderOptions.ceil = $scope.height - 1;
            $scope.width = response.data.width;
            $scope.length = response.data.length;
	    // FROM RYO: width = response.data.width;
            // FROM RYO: length = response.data.length;
	    $scope.startTile = response.data.startTile;
            $scope.numberOfDropTiles = response.data.numberOfDropTiles;;
	    $scope.mtiles = {};
            for(var i = 0; i < response.data.tiles.length; i++){
                $scope.mtiles[response.data.tiles[i].x + ',' +
                              response.data.tiles[i].y + ',' +
                              response.data.tiles[i].z] = response.data.tiles[i];
                for(var j = 0; j < response.data.tiles[i].index.length ; j++){
                    if($scope.stiles[response.data.tiles[i].index[j]].isDropTile){
                        marker[response.data.tiles[i].index[j]] = true;
                    }
                }
            }

	    
	}, function(response){
	    console.log("Error: " + response.statusText);
        });


	/* Doesn't work for Fredrik (maybe Ryo or Sebbe can fix?)
        $http.put("/api/runs/line/"+runId, {status: 1}).then(function(response){
            
        }, function(response){
            console.log("Error: " + response.statusText);
        });*/

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
            swal("Oops!", "All checkpoints are not yet placed.", "error");
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
        $http.put("/api/runs/line/"+runId, {LoPs: $scope.LoPs}).then(function(response){
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
        $http.put("/api/runs/line/"+runId, {LoPs: $scope.LoPs}).then(function(response){
            console.log(response);
            $scope.score = response.data.score;
            $scope.processing[index] = false;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
        if($scope.LoPs[index] >= 3 && !last)swal("LoPs Count > 3", "The team *may* move to next checkpoint tile now.", "info");
    }
    
    $scope.decVictims = function(type){
        if(type == 'live'){
            $scope.rlprocessing = true;
            $scope.rescuedLiveVictims--;
            if($scope.rescuedLiveVictims <= 0)
                $scope.rescuedLiveVictims = 0;

            $http.put("/api/runs/line/"+runId, {rescuedLiveVictims: $scope.rescuedLiveVictims}).then(function(response){
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

            $http.put("/api/runs/line/"+runId, {rescuedDeadVictims: $scope.rescuedDeadVictims}).then(function(response){
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
            $http.put("/api/runs/line/"+runId, {rescuedLiveVictims: $scope.rescuedLiveVictims}).then(function(response){
                $scope.score = response.data.score;
                $scope.rlprocessing = false;
            }, function(response){
                console.log("Error: " + response.statusText);
            });
        }else if(type == 'dead'){
            $scope.rdprocessing = true;
            $scope.rescuedDeadVictims++;
            $http.post("/api/runs/line/"+runId, {rescuedDeadVictims: $scope.rescuedDeadVictims}).then(function(response){
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
            swal("Time Up!", "Do NOT push the Retire button.", "info");
        }
        if($scope.startedTime){
            $timeout(tick, 1000);
	}
    }

    $scope.resetTime = function(){
	$scope.startedTime = false;
	$scope.startTime = 0;
	$scope.time = 0;
    }

    $scope.toggleTime = function(){
        // Start/stop timer
        $scope.startedTime = !$scope.startedTime;
        if($scope.startedTime){
	    if($scope.startTime == 0){
		$scope.startTime = new Date();
	    }
            // Start the timer
            $timeout(tick, $scope.tickInterval);
            /* Doesn't work for Fredrik (maybe Ryo or Sebbe can fix?)
            $http.put("/api/runs/line/"+runId, {status: 2}).then(function(response){
                
            }, function(response){
                console.log("Error: " + response.statusText);
            });
            */
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
        $http.put("/api/runs/line/"+runId, {showedUp: $scope.showedUp}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }
    $scope.changeExitBonus = function(){
        $http.put("/api/runs/line/"+runId, {exitBonus: $scope.exitBonus}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }
    $scope.changeLevel = function(){
        $http.put("/api/runs/line/"+runId, {evacuationLevel: $scope.evacuationLevel}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    }
    
    $scope.doScoring = function(x,y,z){
        var mtile = $scope.mtiles[x+','+y+','+z];
	var stile = [];
	var isDropTile = false;
	var httpdata = {tiles: {}};
	
        // If this is not a created tile
        if(!mtile || mtile.index.length == 0)
            return;

	for(var i = 0; i < mtile.index.length; i++){
	    stile.push($scope.stiles[mtile.index[i]]);
	    if($scope.stiles[mtile.index[i]].isDropTile){
		isDropTile = true;
	    }
	}

	
	// $scope.totalNumberOf(tile.items);
        var total = (mtile.items.obstacles > 0 ||
		     mtile.items.speedbumps > 0 ||
		     mtile.tileType.gaps > 0 ||
		     mtile.tileType.intersections > 0) * mtile.index.length;

        // If the run is not started, we can place drop pucks on this tile
        if(!$scope.startedScoring){
            // We can only place drop markers on tiles without scoring elements (rule 3.3.5)
            if(mtile.index.length == 0){
		swal("Oops!", "Cannot place checkpoint markers on tile that robot can't visit", "error");
            }else if(total > 0){
                swal("Oops!", "Place checkpoint markers on tiles without scoring elements (rule 3.3.5)", "error");
            }else if(mtile.x == $scope.startTile.x &&
		     mtile.y == $scope.startTile.y &&
		     mtile.z == $scope.startTile.z){
		swal("Oops!", "Not allowed to place drop markers on start tile (rule 3.3.6)", "error");
            }else{
                var placed = false;
		var removed = false;
		
		for(var i = 0; i < stile.length; i++){
		    // If this tile already contains a droptile, we should remove it
		    if(stile[i].isDropTile){
			stile[i].isDropTile = false;
			stile[i].scored = false;
			$scope.actualUsedDropTiles--;
			marker[mtile.index[i]] = false;
			removed = true;
                    }// If this tile doesn't contain a droptile, we should add one, IF we have any left to place
		    else if($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
			stile[i].isDropTile = true;
			$scope.actualUsedDropTiles++;
			marker[mtile.index[i]] = true;
			placed = true;
                    }
		    httpdata.tiles[mtile.index[i]] = stile[i];
		}
		
		if(placed){
		    $scope.placedDropTiles++;
		}else if(removed){
		    $scope.placedDropTiles--;
		}
		console.log(httpdata);
                $http.put("/api/runs/line/"+runId, httpdata).then(function(response){
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
            if(isDropTile) {
                total += stile.length;
            }
            
            if(total == 0){
                return;
            }else if(total > 1){
                // Show modal
                mtile.processing = true;
                $scope.open(x,y,z);
                // Save data from modal when closing it
            }else if(total==1){
                mtile.processing = true;
                
		for(var i = 0; i < stile.length; i++){
		    stile[i].scored = !stile[i].scored;
		    httpdata.tiles[mtile.index[i]] = stile[i];
		}
		console.log(httpdata);
                $http.put("/api/runs/line/"+runId, httpdata).then(function(response){
                    $scope.score = response.data.score;
                    mtile.processing = false;
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
                mtile: function() {
                    return $scope.mtiles[x+','+y+','+z];
                },
		stiles: function() {
                    return $scope.stiles;
                }
            }
        }).closed.then(function(result){
            console.log("Closed modal");
            $http.put("/api/runs/line/"+runId, {tiles: $scope.stiles}).then(function(response){
                $scope.score = response.data.score;
                $scope.mtiles[x+','+y+','+z].processing = false;
            }, function(response){
                console.log("Error: " + response.statusText);
            });
        });
    };

    $scope.saveEverything = function(){
        var run = {}
	run.LoPs = $scope.LoPs;
	run.evacuationLevel = $scope.evacuationLevel;
	run.exitBonus = $scope.exitBonus;
	run.rescuedDeadVictims = $scope.rescuedDeadVictims;
	run.rescuedLiveVictims = $scope.rescuedLiveVictims;
        run.showedUp = $scope.showedUp;
	run.started = $scope.started;
	run.tiles = $scope.stiles;
	run.time = {minutes: $scope.minutes, seconds: $scope.seconds};
        run.retired = $scope.retired;
	console.log("Update run", run);
        $http.put("/api/runs/line/"+runId, run).then(function(response){
            $scope.score = response.data.score;
	    console.log("Run updated, got score: ", $scope.score);
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    };
    
    $scope.retire = function(){
        swal({
          title: "Retire?", 
          text: "Are you sure to Retire?", 
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes"
        }, function() {
            $scope.startedTime = 0;
            $scope.minutes = 8
            $scope.seconds = 0 //1 (<-- FOR JAPANOPEN)
            $scope.retired = true;
            $scope.saveEverything();
        });
    }

    $scope.confirm = function(){
        if((!$scope.showedUp || $scope.showedUp == null) && $scope.score >0 ){
            swal("Oops!", "You may have forgot to clear implicit checkpoint", "error");
        }else{
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

            $http.put("/api/runs/line/"+runId, run).then(function(response){
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

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, mtile, stiles) {
    $scope.mtile = mtile;
    $scope.stiles = stiles;
    $scope.words = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"];
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


	    $scope.isDropTile = function(tile){
		if(!tile || tile.index.length == 0)
		    return;
		return $scope.$parent.stiles[tile.index[0]].isDropTile;
	    }
	    
            $scope.isStart = function(tile){
                if(!tile)
                    return;
                return tile.x == $scope.$parent.startTile.x &&
		    tile.y == $scope.$parent.startTile.y &&
		    tile.z == $scope.$parent.startTile.z;                
	    }
            $scope.tileStatus = function(tile){
                // If this is a non-existent tile
                if(!tile || tile.index.length == 0)
                    return;

		// If this tile has no scoring elements we should just return empty string
		if(tile.items.obstacles == 0 &&
		   tile.items.speedbumps == 0 &&
		   tile.tileType.gaps == 0 &&
		   tile.tileType.intersections == 0 &&
		   !$scope.$parent.stiles[tile.index[0]].isDropTile
		  ){
		    return;
		}

		// Number of successfully passed times
		var successfully = 0;
		// Number of times it is possible to pass this tile
		var possible = tile.index.length;
		
		for(var i = 0; i < tile.index.length; i++){
		    if($scope.$parent.stiles[tile.index[i]].scored){
			successfully++;
		    }
		}
                if(tile.processing)
		    return "processing";
                else if(possible > 0 && successfully == possible)
                    return "done";
                else if(successfully > 0)
                    return "halfdone";
                else if(possible > 0)
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
                //console.log('コンテンツ本体：' + b.height() + '×' + b.width());
                //console.log('window：' + window.innerHeight);
                var tilesize_w = ($('.tilearea').width()-50) / width;
                var tilesize_h = (window.innerHeight - 150) / length;
                //console.log('tilesize_w:' + tilesize_w);
                //console.log('tilesize_h:' + tilesize_h);
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
