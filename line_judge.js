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
    $scope.tiles = {};

    $scope.tiles["2,3,1"] = {rot: 180, image: 'tiles/tile-5.png',
                             items: {gaps: 2, obstacles: 0, speedbumps: 3, intersections: 0},
                             scored: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0}};
    $scope.tiles["3,3,1"] = {rot: 90, image: 'tiles/tile-5.png',
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 1},
                             scored: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0}};
    $scope.tiles["3,2,1"] = {rot: 0, image: 'tiles/tile-5.png',
                             items: {gaps: 0, obstacles: 1, speedbumps: 0, intersections: 0},
                             scored: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0}};
    $scope.tiles["2,2,1"] = {rot: 270, image: 'tiles/tile-5.png',
                             items: {gaps: 0, obstacles: 0, speedbumps: 2, intersections: 0},
                             scored: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0}};

    $scope.totalNumberOf = function(objects){
        return objects.gaps + objects.speedbumps + objects.obstacles + objects.intersections;
    }


    $scope.doScoring = function(x,y,z){
        console.log(x,y,z);
        var tile = $scope.tiles[x+','+y+','+z];
        // If this is not a created tile
        if(!tile)
            return;
        var total = $scope.totalNumberOf(tile.items);
        if(total > 1){
            // Show modal
            $scope.open(x,y,z);
        }else if(total==1){
            if(tile.items.gaps>0)
                tile.scored.gaps = (tile.scored.gaps == 0 ? 1 : 0);
            else if(tile.items.speedbumps)
                tile.scored.speedbumps = (tile.scored.speedbumps == 0 ? 1 : 0);
            else if(tile.items.obstacles)
                tile.scored.obstacles = (tile.scored.obstacles == 0 ? 1 : 0);
            else if(tile.items.intersections)
                tile.scored.intersections = (tile.scored.intersections == 0 ? 1 : 0);
        }
        console.log(tile);
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
            templateUrl: 'judge_difficulties.html',
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
    console.log(tile);
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
            x: '@',
            y: '@',
            z: '@',
            tiles: '='
        },
        restrict: 'E',
        templateUrl: 'tile.html',
        link : function($scope, element, attrs){
            $scope.totalNumberOf = function(objects){
                return objects.gaps + objects.speedbumps + objects.obstacles + objects.intersections;
            }

            $scope.tileStatus = function(tile){
                // If this is a non-existent tile
                if(!tile)
                    return;

                if($scope.totalNumberOf(tile.items) == $scope.totalNumberOf(tile.scored))
                    return "done";
                else if($scope.totalNumberOf(tile.scored) > 0)
                    return "halfdone";
                else if($scope.totalNumberOf(tile.items) > 0)
                    return "undone";
            }

        }
    };
});

