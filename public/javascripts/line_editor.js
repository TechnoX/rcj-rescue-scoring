// register the directive with your app module
var app = angular.module('ddApp', ['lvl.services', 'ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log','$http', function($scope, $uibModal, $log, $http){




    $scope.rotateTile = function(x,y){
        // If the tile doesn't exists yet
        if(!$scope.tiles[x+','+y+','+$scope.z])
            return;
        $scope.tiles[x+','+y+','+$scope.z].rot += 90;
        if($scope.tiles[x+','+y+','+$scope.z].rot >= 360)
            $scope.tiles[x+','+y+','+$scope.z].rot = 0;
    }

    $scope.numberOfDropTiles = 0;
    $scope.height = 4;
    $scope.width = 4;
    $scope.length = 7;
    $scope.name = "";
    $scope.range = function(n){
        arr = [];
        for (var i=0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $http.get("dummy.json").then(function(response){
        var tiles = {};
        for(var i = 0; i < response.data.length; i++){
            tiles[response.data[i]._id] = response.data[i];
        }
        $scope.tileBox = tiles;
        console.log("Huhu" , $scope.tileBox);
    }, function(response){
        console.log("Error: " + response.statusText);
    });



    $scope.z = 0;
    $scope.tiles = {};

    $scope.tiles = {
        "2,2,0": {
            "image": "tiles/tile-7.png",
            "rot": 0,
            "tileType": "5708b98454deddcd27756aaa",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "2,3,0": {
            "image": "tiles/tile-13.png",
            "rot": 90,
            "tileType": "5708b9f354deddcd27756ab0",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "2,4,0": {
            "image": "tiles/tile-24.png",
            "rot": 180,
            "tileType": "5708bb0154deddcd27756abb",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "1,4,0": {
            "image": "tiles/tile-22.png",
            "rot": 270,
            "tileType": "5708bacf54deddcd27756ab9",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "1,3,0": {
            "image": "tiles/tile-16.png",
            "rot": 270,
            "tileType": "5708ba4d54deddcd27756ab3",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "0,3,0": {
            "image": "tiles/tile-12.png",
            "rot": 270,
            "tileType": "5708b9d254deddcd27756aaf",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "0,1,0": {
            "image": "tiles/tile-6.png",
            "rot": 270,
            "tileType": "5708b97754deddcd27756aa9",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "0,2,0": {
            "image": "tiles/tile-0.png",
            "rot": 90,
            "tileType": "5708b8ff54deddcd27756aa3",
            "items": {
                "obstacles": 1,
                "speedbumps": 0
            }
        },
        "1,1,0": {
            "image": "tiles/tile-19.png",
            "rot": 0,
            "tileType": "5708ba9f54deddcd27756ab6",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "2,1,0": {
            "image": "tiles/tile-3.png",
            "rot": 0,
            "tileType": "5708b93754deddcd27756aa6",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "1,2,0": {
            "image": "tiles/tile-0.png",
            "rot": 90,
            "tileType": "5708b8ff54deddcd27756aa3",
            "items": {
                "obstacles": 0,
                "speedbumps": 1
            }
        },
        "1,0,0": {
            "image": "tiles/tile-22.png",
            "rot": 0,
            "tileType": "5708bacf54deddcd27756ab9",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            },
            levelUp: "right"
        },
        "2,0,0": {
            "image": "tiles/tile-11.png",
            "rot": 0,
            "tileType": "5708b9c354deddcd27756aae",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            },
            levelDown: "left"
        },
        "3,0,0": {
            "image": "tiles/tile-29.png",
            "rot": 0,
            "tileType": "5708bbba54deddcd27756ac0",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            }
        },
        "3,1,0": {
            "image": "tiles/tile-20.png",
            "rot": 90,
            "tileType": "5708bab454deddcd27756ab7",
            "items": {
                "obstacles": 0,
                "speedbumps": 0
            },
            levelDown: "top"
        }
    };

    $scope.sliderOptions = {
        floor: 0,
        ceil: $scope.height-1,
        vertical: true,
        showSelectionBar: true,
        showTicksValues: true,
        ticksValuesTooltip: function (v) {
            return 'Level ' + v;
        }
    };


    $scope.open = function(x,y) {
        console.log(x+','+y+','+$scope.z);
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'line_editor_modal.html?c',
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
        templateUrl: 'tile.html',
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
