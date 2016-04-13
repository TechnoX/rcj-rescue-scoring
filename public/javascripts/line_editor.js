// register the directive with your app module
var app = angular.module('ddApp', ['lvl.services', 'ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log','$http', function($scope, $uibModal, $log, $http){

    $scope.tileBox = {};
    $http.get("/api/maps/tiletypes").then(function(response){
        for(var i = 0; i < response.data.length; i++){
            $scope.tileBox[response.data[i]._id] = response.data[i];
        }
    }, function(response){
        console.log("Error: " + response.statusText);
    });


    $scope.sliderOptions = {
        floor: 0,
        ceil: 0,
        vertical: true,
        showSelectionBar: true,
        showTicksValues: true,
        ticksValuesTooltip: function (v) {
            return 'Level ' + v;
        }
    };
    $scope.z = 0;
    $scope.tiles = {};


    $http.get("/api/maps/" + mapId + "?populate=true").then(function(response){
        for(var i = 0; i < response.data.tiles.length; i++){
            $scope.tiles[response.data.tiles[i].x + ',' +
                         response.data.tiles[i].y + ',' +
                         response.data.tiles[i].z] = response.data.tiles[i];
        }

        $scope.numberOfDropTiles = response.data.numberOfDropTiles;
        $scope.height = response.data.height;
        $scope.sliderOptions.ceil.height = $scope.height - 1;
        $scope.width = response.data.width;
        $scope.length = response.data.length;
        $scope.name = response.data.name;

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

    $scope.rotateTile = function(x,y){
        // If the tile doesn't exists yet
        if(!$scope.tiles[x+','+y+','+$scope.z])
            return;
        $scope.tiles[x+','+y+','+$scope.z].rot += 90;
        if($scope.tiles[x+','+y+','+$scope.z].rot >= 360)
            $scope.tiles[x+','+y+','+$scope.z].rot = 0;
    }

    $scope.saveMap = function(){
        var map = {
            name: $scope.name,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            numberOfDropTiles: $scope.numberOfDropTiles,
            tiles: $scope.tiles
        };

        console.log(map);
        $http.post("/api/maps/createmap/", map).then(function(response){
            alert("Success!");
            console.log(response.data);
        }, function(response){
            console.log(response);
            console.log("Error: " + response.statusText);
        });
    }


    $scope.open = function(x,y) {
        console.log(x+','+y+','+$scope.z);
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/line_editor_modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'sm',
            resolve: {
                tile: function () {
                    console.log($scope.tiles[x+','+y+','+$scope.z]);
                    return $scope.tiles[x+','+y+','+$scope.z];
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });
    };

    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };

}]);


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, tile) {
    $scope.tile = tile;
    console.log(tile);
    $scope.ok = function () {
        $uibModalInstance.close($scope.tile);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});




app.directive('ngRightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
});



app.directive('tile', function() {
    return {
        scope: {
            tile: '='
        },
        restrict: 'E',
        templateUrl: '/templates/tile.html',
        link: function(scope, element, attrs) {
            scope.rotateRamp = function(direction){
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


app.directive('rotateOnClick', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var deg = 0;
            element.bind('click', function() {
                element.removeClass('rot'+deg);
                deg += 90;
                if(deg >= 360)
                    deg = 0;
                element.addClass('rot'+deg);
                element.attr("rot",deg);
                console.log(deg);
            });
        }
    };
});


app.directive('lvlDraggable', ['$rootScope', 'uuid', function ($rootScope, uuid) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs, controller) {
            console.log("linking draggable element");
            angular.element(el).attr("draggable", "true");

            var id = angular.element(el).attr("id");

            if (!id) {
                id = uuid.new();
                angular.element(el).attr("id", id);
            }
            //console.log(id);
            el.bind("dragstart", function (e) {
                e.dataTransfer.setData('text', id);
                console.log('drag');
                $rootScope.$emit("LVL-DRAG-START");
            });

            el.bind("dragend", function (e) {
                $rootScope.$emit("LVL-DRAG-END");
            });
        }
    };
}]);

app.directive('lvlDropTarget', ['$rootScope', 'uuid', function ($rootScope, uuid) {
    return {
        restrict: 'A',
        link: function (scope, el, attrs, controller) {
            var id = angular.element(el).attr("id");
            if (!id) {
                id = uuid.new();
                angular.element(el).attr("id", id);
            }

            el.bind("dragover", function (e) {
                if (e.preventDefault) {
                    e.preventDefault(); // Necessary. Allows us to drop.
                }

                e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
                return false;
            });

            el.bind("dragenter", function (e) {
                // this / e.target is the current hover target.
                angular.element(e.target).addClass('lvl-over');
            });

            el.bind("dragleave", function (e) {
                angular.element(e.target).removeClass('lvl-over');  // this / e.target is previous target element.
            });

            el.bind("drop", function (e) {
                if (e.preventDefault) {
                    e.preventDefault(); // Necessary. Allows us to drop.
                }

                if (e.stopPropagation) {
                    e.stopPropagation(); // Necessary. Allows us to drop.
                }
                var data = e.dataTransfer.getData("text");
                var dest = document.getElementById(id);
                var src = document.getElementById(data);
                var drop = angular.element(dest); // The div where i dropped the tile
                var drag = angular.element(src); // The div where I lifted this tile


                // If we dropped something on an image this is back to the tool box
                if(drop[0].tagName == "IMG"){
                    // Remove the element from where we dragged it
                    scope.tiles[drag.attr("x")+","+drag.attr("y")+","+drag.attr("z")] = {};
                }else if(drag[0].tagName == "IMG"){// If we drag out an image, this is a new tile
                    console.log(drag.attr("id"));
                    scope.tiles[drop.attr("x")+","+drop.attr("y")+","+drop.attr("z")] = {image: drag.attr("src"),
                                                                                         rot: +drag.attr("rot"),
                                                                                         tileType: drag.attr("tile-id"),
                                                                                         items:{obstacles: 0,
                                                                                                speedbumps: 0}};
                    // We dragged an non-existing tile
                }else if(!scope.tiles[drag.attr("x")+","+drag.attr("y")+","+drag.attr("z")]){
                    // Just ignore!
                    ;
                }else if(drag.attr("x") != drop.attr("x") ||
                         drag.attr("y") != drop.attr("y") ||
                         drag.attr("z") != drop.attr("z")){
                    scope.tiles[drop.attr("x")+","+drop.attr("y")+","+drop.attr("z")] =
                        scope.tiles[drag.attr("x")+","+drag.attr("y")+","+drag.attr("z")];
                    // Remove the element from where we dragged it
                    scope.tiles[drag.attr("x")+","+drag.attr("y")+","+drag.attr("z")] = {};
                }
                console.log(scope.tiles);
                scope.$apply();

            });

            $rootScope.$on("LVL-DRAG-START", function () {
                var el = document.getElementById(id);
                angular.element(el).addClass("lvl-target");
            });

            $rootScope.$on("LVL-DRAG-END", function () {
                var el = document.getElementById(id);
                angular.element(el).removeClass("lvl-target");
                angular.element(el).removeClass("lvl-over");
            });
        }
    };
}]);
