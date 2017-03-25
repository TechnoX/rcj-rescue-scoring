// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log','$timeout', '$http', function($scope, $uibModal, $log, $timeout, $http){

    $scope.z = 0;

    $scope.visType = "side";
    $scope.countWords = ["Bottom", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Ninth"];
    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        showSelectionBar: true,
        showTicksValues: true
    };

    $scope.cells = {};
    $scope.tiles = {};

    if(typeof runId !== 'undefined'){
        loadNewRun();
    }

    (function launchSocketIo() {
        // launch socket.io
        var socket = io.connect(window.location.origin);
        if(typeof runId !== 'undefined'){
            socket.emit('subscribe', 'runs/' + runId);
            socket.on('data', function(data) {
		console.log(data);
		$scope.exitBonus = data.exitBonus;
		$scope.field = data.field.name;
		$scope.round = data.round.name;
		$scope.score = data.score;
		$scope.team = data.team.name;
		$scope.LoPs = data.LoPs;
		
		// Verified time by timekeeper
		$scope.minutes = response.data.time.minutes;
		$scope.seconds = response.data.time.seconds;

		// Scoring elements of the tiles
		for(var i = 0; i < response.data.tiles.length; i++){
		    $scope.tiles[response.data.tiles[i].x + ',' +
				 response.data.tiles[i].y + ',' +
				 response.data.tiles[i].z] = response.data.tiles[i];
		}
	        $scope.$apply();
                console.log("Updated view from socket.io");
            });
        }

        if(typeof fieldId !== 'undefined'){
            socket.emit('subscribe', 'fields/' + fieldId);
            socket.on('data', function(data) {
//                if(typeof runId === 'undefined') || runId != data.newRun){ // TODO: FIX!
                    console.log("Judge changed to a new run");
                    runId = data.newRun;
                    loadNewRun();
//                }
            });


        }

    })();



    function loadNewRun(){    
	$http.get("/api/runs/maze/"+runId+"?populate=true").then(function(response){

	    console.log(response.data);
	    $scope.exitBonus = response.data.exitBonus;
	    $scope.field = response.data.field.name;
	    $scope.round = response.data.round.name;
	    $scope.score = response.data.score;
	    $scope.team = response.data.team.name;
	    $scope.LoPs = response.data.LoPs;
	    
	    // Verified time by timekeeper
            $scope.minutes = response.data.time.minutes;
            $scope.seconds = response.data.time.seconds;

	    // Scoring elements of the tiles
	    for(var i = 0; i < response.data.tiles.length; i++){
		$scope.tiles[response.data.tiles[i].x + ',' +
                             response.data.tiles[i].y + ',' +
                             response.data.tiles[i].z] = response.data.tiles[i];
            }
	    
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
    }

    $scope.range = function(n){
        arr = [];
        for (var i=0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }


    
    $scope.isUndefined = function (thing) {
	return (typeof thing === "undefined");
    }


    $scope.tileStatus = function(x,y,z,isTile){
        // If this is a non-existent tile
	var cell = $scope.cells[x+','+y+','+z];
	if(!cell)
	    return;
	if(!isTile)
	    return;

	if(!$scope.tiles[x+','+y+','+z]){
	    $scope.tiles[x+','+y+','+z] = {scoredItems: {speedbump: false, checkpoint: false, rampBottom: false, rampTop: false, victims: {top: false, right: false, left: false, bottom: false}, rescueKits: {top: 0, right: 0, bottom: 0, left: 0}}};
	}
	var tile = $scope.tiles[x+','+y+','+z];

	// Current "score" for this tile
	var current = 0;
	// Max "score" for this tile. Score is added 1 for every passed mission
	var possible = 0;
	


	if(cell.tile.speedbump){
	    possible++;
	    if(tile.scoredItems.speedbump){
		current++;
	    }
	}
	if(cell.tile.checkpoint){
	    possible++;
	    if(tile.scoredItems.checkpoint){
		current++;
	    }
	}
	if(cell.tile.rampBottom){
	    possible++;
	    if(tile.scoredItems.rampBottom){
		current++;
	    }
	}
	if(cell.tile.rampTop){
	    possible++;
	    if(tile.scoredItems.rampTop){
		current++;
	    }
	}
	switch(cell.tile.victims.top){
	case 'Heated':
	    possible++;
	    current += tile.scoredItems.victims.top || tile.scoredItems.rescueKits.top>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.top >= 1);
	    break;
	case 'H':
	    possible++;
	    current += tile.scoredItems.victims.top || tile.scoredItems.rescueKits.top>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.top >= 2);
	    break;
	case 'S':
	    possible++;
	    current += tile.scoredItems.victims.top || tile.scoredItems.rescueKits.top>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.top >= 1);
	    break;
	case 'U':
	    possible++;
	    current += tile.scoredItems.victims.top || tile.scoredItems.rescueKits.top>0;
	    break;
	}
	switch(cell.tile.victims.right){
	case 'Heated':
	    possible++;
	    current += tile.scoredItems.victims.right || tile.scoredItems.rescueKits.right>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.right >= 1);
	    break;
	case 'H':
	    possible++;
	    current += tile.scoredItems.victims.right || tile.scoredItems.rescueKits.right>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.right >= 2);
	    break;
	case 'S':
	    possible++;
	    current += tile.scoredItems.victims.right || tile.scoredItems.rescueKits.right>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.right >= 1);
	    break;
	case 'U':
	    possible++;
	    current += tile.scoredItems.victims.right || tile.scoredItems.rescueKits.right>0;
	    break;
	}
	switch(cell.tile.victims.bottom){
	case 'Heated':
	    possible++;
	    current += tile.scoredItems.victims.bottom || tile.scoredItems.rescueKits.bottom>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.bottom >= 1);
	    break;
	case 'H':
	    possible++;
	    current += tile.scoredItems.victims.bottom || tile.scoredItems.rescueKits.bottom>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.bottom >= 2);
	    break;
	case 'S':
	    possible++;
	    current += tile.scoredItems.victims.bottom || tile.scoredItems.rescueKits.bottom>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.bottom >= 1);
	    break;
	case 'U':
	    possible++;
	    current += tile.scoredItems.victims.bottom || tile.scoredItems.rescueKits.bottom>0;
	    break;
	}
	switch(cell.tile.victims.left){
	case 'Heated':
	    possible++;
	    current += tile.scoredItems.victims.left || tile.scoredItems.rescueKits.left>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.left >= 1);
	    break;
	case 'H':
	    possible++;
	    current += tile.scoredItems.victims.left || tile.scoredItems.rescueKits.left>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.left >= 2);
	    break;
	case 'S':
	    possible++;
	    current += tile.scoredItems.victims.left || tile.scoredItems.rescueKits.left>0;
	    possible++;
	    current += (tile.scoredItems.rescueKits.left >= 1);
	    break;
	case 'U':
	    possible++;
	    current += tile.scoredItems.victims.left || tile.scoredItems.rescueKits.left>0;
	    break;
	}

	
	if(current > 0 && current == possible)
            return "done";
        else if(current > 0)
            return "halfdone";
        else if(possible > 0)
            return "undone";
        else
            return "";
    }


}]);

