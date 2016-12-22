// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', function($scope, $uibModal, $log, $timeout, $http){



    $scope.z = 0;
    $scope.placedDropTiles = 0;
    $scope.actualUsedDropTiles = 0; // Count droptiles twice that will be passed two times
    $scope.startedScoring = false;
    $scope.startedTime = false;
    $scope.time = 0;

    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        showSelectionBar: true,
        showTicksValues: true
    };



    $scope.tiles = {};

    $http.get("/api/runs/"+runId+"?populate=true").then(function(response){
        $scope.height = response.data.height;
        $scope.sliderOptions.ceil = $scope.height - 1;
        $scope.width = response.data.width;
        $scope.length = response.data.length;
        $scope.team = response.data.team;
        $scope.field = response.data.field;

        $scope.numberOfDropTiles = response.data.numberOfDropTiles;;
        $scope.rescuedVictims = response.data.rescuedVictims;

        for(var i = 0; i < response.data.tiles.length; i++){
            $scope.tiles[response.data.tiles[i].x + ',' +
                         response.data.tiles[i].y + ',' +
                         response.data.tiles[i].z] = response.data.tiles[i];
            if(response.data.tiles[i].scoredItems.dropTiles.length>0){
                $scope.placedDropTiles++;
		$scope.actualUsedDropTiles += response.data.tiles[i].scoredItems.dropTiles.length;
	    }
        }

        $scope.score = response.data.score;
        $scope.showedUp = response.data.showedUp;
        $scope.LoPs = response.data.LoPs;
        // Verified time by timekeeper
        $scope.minutes = response.data.time.minutes;;
        $scope.seconds = response.data.time.seconds;

        console.log($scope.tiles);
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
        $http.post("/api/runs/"+runId+"/update", {LoPs: $scope.LoPs}).then(function(response){
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
        $http.post("/api/runs/"+runId+"/update", {LoPs: $scope.LoPs}).then(function(response){
            console.log(response);
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    }

    $scope.decVictims = function(){
        $scope.rescuedVictims--;
        if($scope.rescuedVictims <= 0)
            $scope.rescuedVictims = 0;

        $http.post("/api/runs/"+runId+"/update", {rescuedVictims: $scope.rescuedVictims}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }
    $scope.incVictims = function(){
        $scope.rescuedVictims++;
        $http.post("/api/runs/"+runId+"/update", {rescuedVictims: $scope.rescuedVictims}).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });

    }

    var tick = function() {
        $scope.time += 1000;
        if($scope.startedTime)
            $timeout(tick, 1000);
    }

    $scope.toggleTime = function(){
        // Start/stop timer
        $scope.startedTime = !$scope.startedTime;
        if($scope.startedTime){
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
        $http.post("/api/runs/"+runId+"/update", {showedUp: $scope.showedUp}).then(function(response){
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
            if(total > 0){
                alert("Place drop markers on tiles without scoring elements (rule 3.3.4)");
            }else{
                if($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
		    if(tile.scoredItems.dropTiles.length > 0){
                        tile.scoredItems.dropTiles = [];
                        $scope.placedDropTiles--;
			$scope.actualUsedDropTiles -= tile.index.length;
                    }else{
                        tile.scoredItems.dropTiles = [];
                        for(var i = 0; i < tile.index.length; i++){
                            tile.scoredItems.dropTiles.push(false);
                        }
                        $scope.placedDropTiles++;
			$scope.actualUsedDropTiles += tile.index.length;
                    }
                }else if(tile.scoredItems.dropTiles.length > 0){
                    tile.scoredItems.dropTiles = [];
                    $scope.placedDropTiles--;
		    $scope.actualUsedDropTiles -= tile.index.length;
                }
                $http.post("/api/runs/"+runId+"/update", {tiles:[tile]}).then(function(response){
                    $scope.score = response.data.score;
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

            if(total == 0){
                return;
            }else if(total > 1){
                // Show modal
                $scope.open(x,y,z);
                // Save data from modal when closing it
            }else if(total==1){
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

                $http.post("/api/runs/"+runId+"/update", {tiles:[tile]}).then(function(response){
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
            console.log("Closed modal");
            $http.post("/api/runs/"+runId+"/update", {tiles:[$scope.tiles[x+','+y+','+z]]}).then(function(response){
                $scope.score = response.data.score;
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
        run.rescuedVictims = $scope.rescuedVictims;
        run.tiles = $scope.tiles;
        run.showedUp = $scope.showedUp;
        run.LoPs = $scope.LoPs;

        $http.post("/api/runs/"+runId+"/update", run).then(function(response){
            $scope.score = response.data.score;
        }, function(response){
            console.log("Error: " + response.statusText);
        });
    };

    $scope.sign = function(){
        var run = {}
        run.rescuedVictims = $scope.rescuedVictims;
        run.tiles = $scope.tiles;
        run.showedUp = $scope.showedUp;
        run.LoPs = $scope.LoPs;
        // Verified time by timekeeper
        run.time = {};
        run.time.minutes = $scope.minutes;;
        run.time.seconds = $scope.seconds;

        $http.post("/api/runs/"+runId+"/update", run).then(function(response){
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

