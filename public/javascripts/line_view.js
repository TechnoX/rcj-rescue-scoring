// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', function($scope, $uibModal, $log){

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

    $scope.visType = "slider";

    $scope.z = 0;
    $scope.tiles = {};

    $scope.tiles["2,3,1"] = {rot: 180, image: 'tiles/tile-5.png', dropTile: true,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scoredItems: {gaps: [], obstacles: [], speedbumps: [], intersections: [], dropTiles: [true]}};
    $scope.tiles["3,3,1"] = {rot: 90, image: 'tiles/tile-5.png', dropTile: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 1},
                             scoredItems: {gaps: [], obstacles: [], speedbumps: [], intersections: [false]}};
    $scope.tiles["3,2,1"] = {rot: 0, image: 'tiles/tile-5.png', dropTile: false,
                             items: {gaps: 0, obstacles: 1, speedbumps: 0, intersections: 0},
                             scoredItems: {gaps: [], obstacles: [false], speedbumps: [], intersections: []}};
    $scope.tiles["2,2,1"] = {rot: 270, image: 'tiles/tile-5.png', dropTile: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scoredItems: {gaps: [], obstacles: [], speedbumps: [], intersections: [], dropTiles: [false,false]}};

    $scope.tiles["2,4,0"] = {rot: 180, image: 'tiles/tile-6.png', dropTile: true,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scoredItems: {gaps: [], obstacles: [], speedbumps: [], intersections: [], dropTiles: [true]}};
    $scope.tiles["3,4,0"] = {rot: 90, image: 'tiles/tile-6.png', dropTile: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scoredItems: {gaps: [], obstacles: [], speedbumps: [], intersections: []}};
    $scope.tiles["3,3,0"] = {rot: 0, image: 'tiles/tile-6.png', dropTile: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scoredItems: {gaps: [], obstacles: [], speedbumps: [], intersections: []}};
    $scope.tiles["2,3,0"] = {rot: 270, image: 'tiles/tile-6.png', dropTile: false,
                             items: {gaps: 0, obstacles: 0, speedbumps: 0, intersections: 0},
                             scoredItems: {gaps: [], obstacles: [], speedbumps: [], intersections: [], dropTiles: [false,false]}};



    $scope.getOpacity = function(x,y){
        var stackedTiles = 0;
        for(var z = 0; z < $scope.height; z++){
            if($scope.tiles[x+','+y+','+z])
                stackedTiles++;
        }
        return 1.0/stackedTiles;
    }


    $scope.sliderOptions = {
        floor: 0,
        ceil: $scope.height-1,
        showSelectionBar: true,
        showTicksValues: true,
        ticksValuesTooltip: function (v) {
            return 'Level ' + v;
        }
    };

}]);



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

