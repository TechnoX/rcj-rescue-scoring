// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log','$timeout', '$http', function($scope, $uibModal, $log, $timeout, $http){

    $scope.z = 0;
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

    $scope.cells = {};

    $http.get("/api/runs/maze/"+runId+"?populate=true").then(function(response){

	console.log(response.data);
	$scope.exitBonus = response.data.exitBonus;
	$scope.field = response.data.field.name;
	$scope.round = response.data.round.name;
	$scope.score = response.data.score;
	$scope.started = response.data.score;
	$scope.team = response.data.team.name;
	$scope.LoPs = response.data.LoPs;
		
	// Verified time by timekeeper
        $scope.minutes = response.data.time.minutes;
        $scope.seconds = response.data.time.seconds;

	// Scoring elements of the tiles
        $scope.tiles = response.data.tiles;
	
	// Get the map
	$http.get("/api/maps/maze/" + response.data.map + "?populate=true").then(function(response){
	    console.log(response.data);
            $scope.startTile = response.data.startTile;
            $scope.height = response.data.height;
            $scope.sliderOptions.ceil = $scope.height - 1;
            $scope.width = response.data.width;
            $scope.length = response.data.length;
	    
	    for(var i = 0; i < response.data.cells.length; i++){
                $scope.cells[response.data.cells[i].x + ',' +
                             response.data.cells[i].y + ',' +
                             response.data.cells[i].z] = response.data.cells[i];
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


    $scope.decrement = function(){
        $scope.LoPs--;
        if($scope.LoPs < 0)
            $scope.LoPs = 0;
	    
        $http.put("/api/runs/maze/"+runId, {LoPs: $scope.LoPs}).then(function(response){
            console.log(response);
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }
    $scope.increment = function(){
        $scope.LoPs++;
        
        $http.put("/api/runs/maze/"+runId, {LoPs: $scope.LoPs}).then(function(response){
            console.log(response);
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
    
    $scope.changeExitBonus = function(){
        $http.put("/api/runs/line/"+runId, {exitBonus: $scope.exitBonus}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    }
    
    $scope.isUndefined = function (thing) {
	return (typeof thing === "undefined");
    }
    
    $scope.cellClick = function(x,y,z,isWall,isTile){
	var cell = $scope.cells[x+','+y+','+z];
	if(!cell)
	    return;
	
	// If wall 
	if(isWall){
	    // TODO: Do something
	    console.log("Clicked wall");
	}
	else if(isTile){
	    // TODO: Do something
	    console.log("Clicked tile");
	}
    }

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

