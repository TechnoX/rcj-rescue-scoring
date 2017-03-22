// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', function($scope, $uibModal, $log, $timeout, $http){



    $scope.z = 0;
    $scope.placedDropTiles = 0;
    $scope.actualUsedDropTiles = 0; // Count droptiles twice that will be passed two times
    $scope.startedScoring = false;
    $scope.startedTime = false;
    $scope.startTime = 0;
    $scope.time = 0;
    
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
	// Verified time by timekeeper
        $scope.minutes = response.data.time.minutes;
        $scope.seconds = response.data.time.seconds;


	// Scoring elements of the tiles
        $scope.stiles = response.data.tiles;
	
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
	    $scope.startTile = response.data.startTile;
            $scope.numberOfDropTiles = response.data.numberOfDropTiles;;

            for(var i = 0; i < response.data.tiles.length; i++){
                $scope.mtiles[response.data.tiles[i].x + ',' +
                              response.data.tiles[i].y + ',' +
                              response.data.tiles[i].z] = response.data.tiles[i];
            }

	    
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


    $scope.toggleScoring = function(){
        if($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
            alert("All checkpoints are not yet placed.");
            return;
        }
        // Start/stop scoring
        $scope.startedScoring = !$scope.startedScoring;
        if(!$scope.startedScoring)
            $scope.saveEverything();
    }

    $scope.decrement = function(index){
        if($scope.LoPs[index])
            $scope.LoPs[index]--;
        else
            $scope.LoPs[index] = 0;
        if($scope.LoPs[index] < 0)
            $scope.LoPs[index] = 0;
        $http.put("/api/runs/line/"+runId, {LoPs: $scope.LoPs}).then(function(response){
            console.log(response);
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }
    $scope.increment = function(index){
        if($scope.LoPs[index])
            $scope.LoPs[index]++;
        else
            $scope.LoPs[index] = 1;
        if($scope.LoPs[index] >= 3)
            $timeout(function(){alert("The team *may* move to next drop tile now.");},20);
        $http.put("/api/runs/line/"+runId, {LoPs: $scope.LoPs}).then(function(response){
            console.log(response);
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    }

    $scope.decVictims = function(counter){
	if(counter=='live'){
            $scope.rescuedLiveVictims--;
            if($scope.rescuedLiveVictims <= 0)
		$scope.rescuedLiveVictims = 0;
	}else{
            $scope.rescuedDeadVictims--;
            if($scope.rescuedDeadVictims <= 0)
		$scope.rescuedDeadVictims = 0;
	}

        $http.put("/api/runs/line/"+runId, {rescuedLiveVictims: $scope.rescuedLiveVictims, rescuedDeadVictims: $scope.rescuedDeadVictims}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }
    $scope.incVictims = function(counter){
	if(counter == 'live'){
            $scope.rescuedLiveVictims++;
	}else{
            $scope.rescuedDeadVictims++;
	}

        $http.put("/api/runs/line/"+runId, {rescuedLiveVictims: $scope.rescuedLiveVictims, rescuedDeadVictims: $scope.rescuedDeadVictims}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }

    var tick = function() {
        if($scope.startedTime){
            $timeout(tick, 1000);
            $scope.time = ((new Date()) - $scope.startTime) ;
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
        }else{
            // Save everything when you stop the time
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
		     isDropTile > 0 ||
		     mtile.tileType.intersections > 0) * mtile.index.length;

        // If the run is not started, we can place drop pucks on this tile
        if(!$scope.startedScoring){
            // We can only place drop markers on tiles without scoring elements (rule 3.3.5)
            if(total > 0){
                alert("Place drop markers on tiles without scoring elements (rule 3.3.5)");
            }else if(mtile.x == $scope.startTile.x &&
		     mtile.y == $scope.startTile.y &&
		     mtile.z == $scope.startTile.z){
		alert("Not allowed to place drop markers on start tile (rule 3.3.6)");
	    }else{
		var placed = false;
		var removed = false;

		
		for(var i = 0; i < stile.length; i++){
		    // If this tile already contains a droptile, we should remove it
		    if(stile[i].isDropTile){
			stile[i].isDropTile = false;
			$scope.actualUsedDropTiles--;
			removed = true;
                    }// If this tile doesn't contain a droptile, we should add one, IF we have any left to place
		    else if($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
			stile[i].isDropTile = true;
			$scope.actualUsedDropTiles++;
			placed = true;
                    }
		    httpdata.tiles[stile[i]._id] = stile[i];
		}

		if(placed){
		    $scope.placedDropTiles++;
		}else if(removed){
		    $scope.placedDropTiles--;
		}
		console.log(httpdata);
                $http.put("/api/runs/line/"+runId, httpdata).then(function(response){
		    console.log("got reply", response.data.score);
                    $scope.score = response.data.score;
                }, function(response){
                    console.log("Error: " + response.statusText);
                });
		
            }

        // Match has started!
        }else{
            // Add the number of possible passes for drop tiles
            /*if(isDropTile) {
                total += stile.length;
            }*/

            if(total == 0){
                return;
            }else if(total > 1){
                // Show modal
                $scope.open(x,y,z);
                // Save data from modal when closing it
            }else if(total==1){
		for(var i = 0; i < stile.length; i++){
		    stile[i].scored = !stile[i].scored;
		    httpdata.tiles[stile[i]._id] = stile[i];
		}
		console.log(httpdata);
                $http.put("/api/runs/line/"+runId, httpdata).then(function(response){
                    $scope.score = response.data.score;
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
            $http.put("/api/runs/line/"+runId, {tiles:[$scope.tiles[x+','+y+','+z]]}).then(function(response){
                $scope.score = response.data.score;
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
	run.rescuedLiveVictim = $scope.rescuedLiveVictims;
        run.showedUp = $scope.showedUp;
	run.started = $scope.started;
	run.tiles = $scope.stiles;
	run.time = {minutes: $scope.minutes, seconds: $scope.seconds};

	console.log("Update run", run);
        $http.put("/api/runs/line/"+runId, run).then(function(response){
            $scope.score = response.data.score;
	    console.log("Run updated, got score: ", $scope.score);
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    };

    $scope.sign = function(){
        var run = {}
        run.rescuedDeadVictims = $scope.rescuedDeadVictims;
	run.rescuedLiveVictims = $scope.rescuedLiveVictims;
        run.tiles = $scope.tiles;
        run.showedUp = $scope.showedUp;
        run.LoPs = $scope.LoPs;
        // Verified time by timekeeper
        run.time = {};
        run.time.minutes = $scope.minutes;;
        run.time.seconds = $scope.seconds;

        $http.put("/api/runs/line/"+runId, run).then(function(response){
            $scope.score = response.data.score;
            alert("Run signed");
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    };

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


	    $scope.isDropTile = function(tile){
		if(!tile)
		    return;
		return $scope.$parent.stiles[tile.index[0]].isDropTile;
	    }
	    
            $scope.tileStatus = function(tile){
                // If this is a non-existent tile
                if(!tile)
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
                if(possible > 0 && successfully == possible)
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

