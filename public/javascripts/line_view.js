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
    $scope.tiles = {};
    $http.get("/api/runs/570eb85c682468cf3e194637?populate=true").then(function(response){
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


    (function launchSocketIo() {
        // launch socket.io
        var socket = io.connect(window.location.origin);
        socket.emit('subscribe', 'runs/' + runId);
        socket.on('data', function(data) {
            $scope.rescuedVictims = data.rescuedVictims;

            for(var i = 0; i < data.tiles.length; i++){
                $scope.tiles[data.tiles[i].x + ',' +
                             data.tiles[i].y + ',' +
                             data.tiles[i].z].scoredItems = data.tiles[i].scoredItems;
         }
            $scope.score = data.score;
            $scope.showedUp = data.showedUp;
            $scope.LoPs = data.LoPs;
            $scope.minutes = data.time.minutes;;
            $scope.seconds = data.time.seconds;
            $scope.$apply();
            console.log("Updated view from socket.io");
        });
    })();

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
            if($scope.tiles[x+','+y+','+z])
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
