// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$http', '$log', function($scope, $http, $log){

    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        showSelectionBar: true,
        showTicksValues: true
    };

    $scope.visType = "slider";
    $scope.z = 0;

    // Scoring elements of the tiles
    $scope.stiles = [];
    // Map (images etc.) for the tiles
    $scope.mtiles = [];


    
    if(typeof runId !== 'undefined'){
        loadNewRun();
    }

    (function launchSocketIo() {
        // launch socket.io
        var socket = io.connect(window.location.origin);
        if(typeof runId !== 'undefined'){
            socket.emit('subscribe', 'runs/' + runId);
	    
            socket.on('data', function(data) {
                $scope.rescuedVictims = data.rescuedVictims;
		$scope.stiles = data.tiles;
                $scope.score = data.score;
                $scope.showedUp = data.showedUp;
                $scope.LoPs = data.LoPs;
                $scope.minutes = data.time.minutes;;
                $scope.seconds = data.time.seconds;
                $scope.$apply();
                console.log("Updated view from socket.io");
            });
        }

        if(typeof fieldIds !== 'undefined'){
	    console.log(fieldIds);
	    var fields = fieldIds.split(',');
	    for(var i = 0; i < fields.length; i++){
		socket.emit('subscribe', 'fields/' + fields[i]);
	    }
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
    }


    $scope.range = function(n){
        arr = [];
        for (var i=0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.getOpacity = function(x,y){
        var stackedTiles = 0;
        for(var z = 0; z < $scope.height; z++){
            if($scope.mtiles[x+','+y+','+z])
                stackedTiles++;
        }
        return 1.0/stackedTiles;
    }



}]);



app.directive('tile', function() {
    return {
        scope: {
            tile: '='
        },
        restrict: 'E',
        templateUrl: '/templates/tile.html',
        link : function($scope, element, attrs){

	    $scope.isDropTile = function(tile){
		if(!tile || tile.index.length == 0)
		    return;
		return $scope.$parent.stiles[tile.index[0]].isDropTile;
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
