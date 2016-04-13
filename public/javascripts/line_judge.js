// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', function($scope, $uibModal, $log, $timeout){


    $scope.data = {"round":{"name":"Testrunda","competition":"570a771354deddcd27756ac1","_id":"570d5a5b2d39ab0156e03eea","__v":0},"team":{"name":"The Saviors","league":"primary","_id":"570907176bdbcc4a434a4287","__v":0,"competition":"570a771354deddcd27756ac1"},"field":{"name":"Bana 1","competition":"570a771354deddcd27756ac1","_id":"570d63b3b40df5316136cd45","__v":0},"competition":{"name":"SM 2016","_id":"570a771354deddcd27756ac1"},"height":1,"width":2,"length":1,"numberOfDropTiles":1,"rescuedVictims":0,"score":0,"_id":"570e77c0de01813819df4cf0","__v":0,"time":{"minutes":0,"seconds":0},"LoPs":[0],"startTile":{"z":0,"y":0,"x":0},"tiles":[{"x":0,"y":0,"z":0,"tileType":{"image":"tile-0.png","gaps":0,"intersections":0,"_id":"5708b8ff54deddcd27756aa3","paths":{"left":"right","right":"left"}},"rot":0,"_id":"570e77c0de01813819df4cf2","index":[0],"scoredItems":{"dropTiles":[],"gaps":[],"intersections":[],"speedbumps":[false],"obstacles":[false,false]},"items":{"obstacles":2,"speedbumps":1,"intersections":0,"gaps":0}},{"x":1,"y":0,"z":0,"tileType":{"image":"tile-0.png","gaps":0,"intersections":0,"_id":"5708b8ff54deddcd27756aa3","paths":{"left":"right","right":"left"}},"rot":0,"_id":"570e77c0de01813819df4cf1","index":[1],"scoredItems":{"dropTiles":[],"gaps":[],"intersections":[],"speedbumps":[],"obstacles":[false,false]},"items":{"obstacles":2,"speedbumps":0,"intersections":0,"gaps":0}}]};

    $scope.height = $scope.data.height;
    $scope.width = $scope.data.width;
    $scope.length = $scope.data.length;

    $scope.numberOfDropTiles = $scope.data.numberOfDropTiles;;
    $scope.rescuedVictims = $scope.data.rescuedVictims;

    $scope.tiles = {};
    for(var i = 0; i < $scope.data.tiles.length; i++){
        $scope.tiles[$scope.data.tiles[i].x + ',' +
                     $scope.data.tiles[i].y + ',' +
                     $scope.data.tiles[i].z] = $scope.data.tiles[i];
    }


    $scope.score = $scope.data.score;
    $scope.showedUp = $scope.data.showedUp;
    $scope.LoPs = $scope.data.LoPs;
    // Verified time by timekeeper
    $scope.minutes = $scope.data.time.minutes;;
    $scope.seconds = $scope.data.time.seconds;


    $scope.z = 0;
    $scope.placedDropTiles = 0;
    $scope.startedScoring = false;
    $scope.startedTime = false;
    $scope.time = 0;

    $scope.range = function(n){
        arr = [];
        for (var i=0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.startScoring = function(){
        if($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
            alert("All droptiles are not yet placed.");
            return;
        }
        // Start/stop scoring
        $scope.startedScoring = !$scope.startedScoring;
    }

    $scope.decrement = function(index){
        if($scope.LoPs[index])
            $scope.LoPs[index]--;
        else
            $scope.LoPs[index] = 0;
        if($scope.LoPs[index] < 0)
            $scope.LoPs[index] = 0;
    }
    $scope.increment = function(index){
        if($scope.LoPs[index])
            $scope.LoPs[index]++;
        else
            $scope.LoPs[index] = 1;
        if($scope.LoPs[index] >= 3)
            $timeout(function(){alert("The team *may* move to next drop tile now.");},20);
    }

    var tick = function() {
        $scope.time += 1000;
        if($scope.startedTime)
            $timeout(tick, 1000);
    }

    $scope.startTime = function(){
        // Start/stop timer
        $scope.startedTime = !$scope.startedTime;
        if($scope.startedTime){
            // Start the timer
            $timeout(tick, $scope.tickInterval);
        }
    }


    $scope.totalNumberOf = function(objects){
        return objects.gaps + objects.speedbumps + objects.obstacles + objects.intersections;
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
                    tile.dropTile = !tile.dropTile;
                    if(tile.dropTile)
                        $scope.placedDropTiles++;
                    else
                        $scope.placedDropTiles--;
                }else if(tile.dropTile){
                    tile.dropTile = false;
                    $scope.placedDropTiles--;
                }
            }

        // Match has started!
        }else{
            // Add the number of possible passes for drop tiles
            if(tile.dropTile) {
                total += tile.scoredItems.dropTile.length;
            }

            if(total > 1){
                // Show modal
                $scope.open(x,y,z);
            }else if(total==1){
                if(tile.items.gaps>0)
                    tile.scoredItems.gaps[0] = !tile.scoredItems.gaps[0];
                else if(tile.items.speedbumps)
                    tile.scoredItems.speedbumps[0] = !tile.scoredItems.speedbumps[0];
                else if(tile.items.obstacles)
                    tile.scoredItems.obstacles[0] = !tile.scoredItems.obstacles[0];
                else if(tile.items.intersections)
                    tile.scoredItems.intersections[0] = !tile.scoredItems.intersections[0];
                else if(tile.dropTile)
                    tile.scoredItems.dropTiles[0] = !tile.scoredItems.dropTiles[0];
            }
        }
    }


    $scope.sliderOptions = {
        floor: 0,
        ceil: $scope.height-1,
        showSelectionBar: true,
        showTicksValues: true
    };


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

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
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
                if(tile.dropTile)
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

        }
    };
});

