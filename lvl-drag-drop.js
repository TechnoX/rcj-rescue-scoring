// register the directive with your app module
var app = angular.module('ddApp', ['lvl.services']);

// function referenced by the drop target
app.controller('ddController', ['$scope' , function($scope){
    $scope.dropped = function(dragEl, dropEl) {
        //the directive provides a native dom object, wrap with jqlite
        var drop = angular.element(dropEl); // The div where i dropped the tile
        var drag = angular.element(dragEl); // The div where I lifted this tile

        console.log(drop.attr("x"));

        $scope.tiles[drop.attr("x")+","+drop.attr("y")] = $scope.tiles[drag.attr("x")+","+drag.attr("y")];
        $scope.tiles[drag.attr("x")+","+drag.attr("y")] = {};
        console.log($scope.tiles);
        $scope.$apply();
    }

    $scope.tiles = {};

    $scope.tiles["2,3"] = {rot: '0',   image: 'tile-5.png'};
/*    $scope.tiles["2,4"] = {rot: '0'};
    $scope.tiles["2,5"] = {rot: '270', image: 'tile-6.png'};
    $scope.tiles["3,3"] = {rot: '90',  image: 'tile-4.png'};
    $scope.tiles["3,4"] = {rot: '90',  image: 'tile-4.png'};
    $scope.tiles["3,5"] = {rot: '180'};
*/
}]);


app.directive('tile', function() {
    return {
        scope: {
            x: '@',
            y: '@',
            tiles: '=tiles'
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
                deg+= parseInt(attrs.rotateOnClick, 10);
                element.css({
                    webkitTransform: 'rotate('+deg+'deg)',
                    mozTransform: 'rotate('+deg+'deg)',
                    msTransform: 'rotate('+deg+'deg)',
                    oTransform: 'rotate('+deg+'deg)',
                    transform: 'rotate('+deg+'deg)'
                });
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
        scope: {
            onDrop: '&',
            col: '=',
            row: '=',
            tiles: '='
        },
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

                scope.onDrop({dragEl: src, dropEl: dest});
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
