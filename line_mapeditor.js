// register the directive with your app module
var app = angular.module('ddApp', ['lvl.services', 'ngAnimate', 'ui.bootstrap', 'rzModule']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', function($scope, $uibModal, $log){

    $scope.rotateTile = function(x,y){
        // If the tile doesn't exists yet
        if(!$scope.tiles[x+','+y+','+$scope.z])
            return;
        $scope.tiles[x+','+y+','+$scope.z].rot += 90;
        if($scope.tiles[x+','+y+','+$scope.z].rot >= 360)
            $scope.tiles[x+','+y+','+$scope.z].rot = 0;
    }

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

    $scope.tiles["2,3,1"] = {rot: 0, image: 'tiles/tile-5.png',
                             items: {gaps: 2, obstacles: 0, speedbumps: 3, intersections: 0}};
/*    $scope.tiles["2,4"] = {rot: '0'};
    $scope.tiles["2,5"] = {rot: '270', image: 'tile-6.png'};
    $scope.tiles["3,3"] = {rot: '90',  image: 'tile-4.png'};
    $scope.tiles["3,4"] = {rot: '90',  image: 'tile-4.png'};
    $scope.tiles["3,5"] = {rot: '180'};
*/



    $scope.sliderOptions = {
        floor: 1,
        ceil: $scope.height,
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
            templateUrl: 'editor_items_modal.html',
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
            x: '@',
            y: '@',
            z: '@',
            tiles: '='
        },
        restrict: 'E',
        templateUrl: 'tile.html'
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
                    scope.tiles[drop.attr("x")+","+drop.attr("y")+","+drop.attr("z")] = {image: drag.attr("src"),
                                                                                         rot: +drag.attr("rot"),
                                                                                         items:{gaps: 0,
                                                                                                obstacles: 0,
                                                                                                speedbumps: 0,
                                                                                                intersections: 0}};
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
