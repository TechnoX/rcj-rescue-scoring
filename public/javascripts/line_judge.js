// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', function($scope, $uibModal, $log, $timeout){

    $scope.height = 4;
    $scope.width = 4;
    $scope.length = 7;
    $scope.range = function(n){
        arr = [];
        for (var i=0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.z = 0;
    $scope.numberOfDropTiles = 2;
    $scope.placedDropTiles = 0;
    $scope.rescuedVictims = 0;

    $scope.tiles = {};

    $scope.tiles["2,3,0"] = {rot: 180, image: 'tiles/tile-5.png', dropTile: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scored: {gaps: [], obstacles: [], speedbumps: [], intersections: [], reach: [false]}};
    $scope.tiles["3,3,0"] = {rot: 90, image: 'tiles/tile-5.png', dropTile: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 1},
                             scored: {gaps: [], obstacles: [], speedbumps: [], intersections: [false]}};
    $scope.tiles["3,2,0"] = {rot: 0, image: 'tiles/tile-5.png', dropTile: false,
                             items: {gaps: 0, obstacles: 1, speedbumps: 0, intersections: 0},
                             scored: {gaps: [], obstacles: [false], speedbumps: [], intersections: []}};
    $scope.tiles["2,2,0"] = {rot: 270, image: 'tiles/tile-5.png', dropTile: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scored: {gaps: [], obstacles: [], speedbumps: [], intersections: [], reach: [false,false]}};

    $scope.startedScoring = false;

    $scope.startScoring = function(){
        if($scope.numberOfDropTiles - $scope.placedDropTiles > 0) {
            alert("All droptiles are not yet placed.");
            return;
        }
        // Start/stop scoring
        $scope.startedScoring = !$scope.startedScoring;
    }

    $scope.score = 123;
    $scope.showedUp = false;

    $scope.LoPs = [];
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



    // Verified time by timekeeper
    $scope.minutes = 0;
    $scope.seconds = 0;

    $scope.startedTime = false;
    $scope.time = 0;

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
                total += tile.scored.reach.length;
            }

            if(total > 1){
                // Show modal
                $scope.open(x,y,z);
            }else if(total==1){
                if(tile.items.gaps>0)
                    tile.scored.gaps[0] = !tile.scored.gaps[0];
                else if(tile.items.speedbumps)
                    tile.scored.speedbumps[0] = !tile.scored.speedbumps[0];
                else if(tile.items.obstacles)
                    tile.scored.obstacles[0] = !tile.scored.obstacles[0];
                else if(tile.items.intersections)
                    tile.scored.intersections[0] = !tile.scored.intersections[0];
                else if(tile.dropTile)
                    tile.scored.reach[0] = !tile.scored.reach[0];
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
            templateUrl: 'line_judge_modal.html',
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
        templateUrl: 'tile.html',
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
                count(tile.scored.gaps);
                count(tile.scored.speedbumps);
                count(tile.scored.intersections);
                count(tile.scored.obstacles);
                if(tile.dropTile)
                    count(tile.scored.reach);

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

