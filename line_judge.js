// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', function($scope, $uibModal, $log){

    $scope.height = 4;
    $scope.width = 4;
    $scope.length = 7;
    $scope.range = function(n){
        arr = [];
        for (var i=1; i<=n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.z = 1;
    $scope.numberOfDropTiles = 2;
    $scope.tiles = {};

    $scope.tiles["2,3,1"] = {rot: 180, image: 'tiles/tile-5.png', dropTile: true, reach: false,
                             items: {gaps: 2, obstacles: 0, speedbumps: 3, intersections: 0},
                             scored: {gaps: [true,false], obstacles: [], speedbumps: [false,false,false], intersections: []}};
    $scope.tiles["3,3,1"] = {rot: 90, image: 'tiles/tile-5.png', dropTile: false, reach: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 1},
                             scored: {gaps: [], obstacles: [], speedbumps: [], intersections: [false]}};
    $scope.tiles["3,2,1"] = {rot: 0, image: 'tiles/tile-5.png', dropTile: false, reach: false,
                             items: {gaps: 0, obstacles: 1, speedbumps: 0, intersections: 0},
                             scored: {gaps: [], obstacles: [false], speedbumps: [], intersections: []}};
    $scope.tiles["2,2,1"] = {rot: 270, image: 'tiles/tile-5.png', dropTile: false, reach: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scored: {gaps: [], obstacles: [], speedbumps: [], intersections: []}};

    $scope.started = false;

    $scope.start = function(){
        // Start timer
        $scope.started = true;
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
        if(!$scope.started){
            // We can only place drop markers on tiles without scoring elements (rule 3.3.4)
            if(total > 0){
                alert("Place drop markers on tiles without scoring elements (rule 3.3.4)");
            }else{
                if($scope.numberOfDropTiles > 0) {
                    tile.dropTile = !tile.dropTile;
                    if(tile.dropTile)
                        $scope.numberOfDropTiles--;
                    else
                        $scope.numberOfDropTiles++;
                }else if(tile.dropTile){
                    tile.dropTile = false;
                    $scope.numberOfDropTiles++;
                }
            }
        }else if(total > 1){
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
        }else if(tile.dropTile){
            tile.reach = !tile.reach;
        }
    }


    $scope.sliderOptions = {
        floor: 1,
        ceil: $scope.height,
        showSelectionBar: true,
        showTicksValues: true,
        ticksValuesTooltip: function (v) {
            return 'Level ' + v;
        }
    };


    $scope.open = function(x,y,z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'judge_modal.html',
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

                if(possible > 0 && successfully == possible)
                    return "done";
                else if(successfully > 0)
                    return "halfdone";
                else if(possible > 0)
                    return "undone";
                else if(tile.dropTile)
                    return tile.reach?"done":"undone";
            }

        }
    };
});

