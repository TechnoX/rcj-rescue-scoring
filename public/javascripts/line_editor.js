// register the directive with your app module
var app = angular.module('LineEditor', ['ngTouch','lvl.services', 'ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);

// function referenced by the drop target
app.controller('LineEditorController', ['$scope', '$uibModal', '$log', '$http', '$translate', function ($scope, $uibModal, $log, $http, $translate) {

    $scope.competitionId = competitionId;
    $scope.se_competition = competitionId;
    $translate('admin.lineMapEditor.import').then(function (val) {
        $("#select").fileinput({
            'showUpload': false,
            'showPreview': false,
            'showRemove': false,
            'showCancel': false,
            'msgPlaceholder': val,
            allowedFileExtensions: ['json'],
            msgValidationError: "ERROR"
        });
    }, function (translationId) {
        // = translationId;
    });


    $http.get("/api/competitions/").then(function (response) {
        $scope.competitions = response.data
        //console.log($scope.competitions)
    })

    $scope.tileSets = [];
    $scope.tileSet = {};
    $http.get("/api/maps/line/tilesets?populate=true").then(function (response) {
        $scope.tileSets = response.data
        $scope.tileSet = $scope.tileSets[0]
    }, function (response) {
        console.log("Error: " + response.statusText);
    });


    $scope.z = 0;
    $scope.tiles = {};
    $scope.startTile = {
        x: -1,
        y: -1,
        z: -1
    };
    $scope.numberOfDropTiles = 0;
    $scope.height = 1;
    $scope.width = 1;
    $scope.length = 1;
    $scope.liveV = 0;
    $scope.deadV = 0;
    $scope.name = "Awesome Testbana";

    if (mapId) {
        $http.get("/api/maps/line/" + mapId +
            "?populate=true").then(function (response) {
            //console.log(response)
            for (var i = 0; i < response.data.tiles.length; i++) {
                $scope.tiles[response.data.tiles[i].x + ',' +
                response.data.tiles[i].y + ',' +
                response.data.tiles[i].z] = response.data.tiles[i];
            }
            $scope.competitionId = response.data.competition;
            $http.get("/api/competitions/" +
                $scope.competitionId).then(function (response) {
                $scope.competition = response.data.name;
            })

            $scope.startTile = response.data.startTile;
            $scope.numberOfDropTiles = response.data.numberOfDropTiles;
            $scope.height = response.data.height;
            $scope.width = response.data.width;
            $scope.length = response.data.length;
            $scope.name = response.data.name;
            $scope.finished = response.data.finished;
            $scope.liveV = response.data.victims.live;
            $scope.deadV = response.data.victims.dead;

        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    } else {
        $http.get("/api/competitions/" +
            $scope.competitionId).then(function (response) {
            $scope.competition = response.data.name;
        })
    }

    $scope.go = function (path) {
        window.location = path
    }
    
    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.changeFloor = function (z) {
        $scope.z = z;
    }

    $scope.rotateTile = function (x, y) {
        // If the tile doesn't exists yet
        if (!$scope.tiles[x + ',' + y + ',' + $scope.z])
            return;
        $scope.tiles[x + ',' + y + ',' + $scope.z].rot += 90;
        if ($scope.tiles[x + ',' + y + ',' + $scope.z].rot >= 360)
            $scope.tiles[x + ',' + y + ',' + $scope.z].rot = 0;
    }


    $scope.startNotSet = function () {
        return $scope.startTile.x == -1 && $scope.startTile.y == -1 &&
            $scope.startTile.z == -1;
    }


    $scope.saveMapAs = function () {
        if ($scope.startNotSet()) {
            alert("You must define a starting tile by right-clicking a tile");
            return;
        }

        if ($scope.saveasname == $scope.name && $scope.se_competition == competitionId) {
            alert("You must have a new name when saving as!");
            return;
        }
        var victims = {};
        victims.live = $scope.liveV;
        victims.dead = $scope.deadV;
        var map = {
            competition: $scope.se_competition,
            name: $scope.saveasname,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            finished: $scope.finished,
            numberOfDropTiles: $scope.numberOfDropTiles,
            startTile: $scope.startTile,
            tiles: $scope.tiles,
            victims: victims
        };

        $http.post("/api/maps/line", map).then(function (response) {
            alert("Created map!");
            //console.log(response.data);
            window.location.replace("/admin/" + $scope.se_competition + "/line/editor/" + response.data.id)
        }, function (response) {
            console.log(response);
            console.log("Error: " + response.statusText);
            alert(response.data.msg);
        });
    }
    
    
    $scope.saveMap = function () {
        if ($scope.startNotSet()) {
            alert("You must define a starting tile by right-clicking a tile");
            return;
        }
        if ($scope.numberOfDropTiles == 0) {
            if (!confirm("Are you sure you want to create a map without droptiles??")) {
                return;
            }
        }

        if (!$scope.finished) {
            if (!confirm("Your map is not marked as finished, are you sure you still want to save??")) {
                return;
            }
        }
        
        var victims = {};
        victims.live = $scope.liveV;
        victims.dead = $scope.deadV;

        var map = {
            competition: $scope.competitionId,
            name: $scope.name,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            finished: $scope.finished,
            numberOfDropTiles: $scope.numberOfDropTiles,
            startTile: $scope.startTile,
            tiles: $scope.tiles,
            victims: victims
        };

        console.log(map);
        console.log("Update map", mapId);
        console.log("Competition ID", $scope.competitionId);
        if (mapId) {
            $http.put("/api/maps/line/" + mapId, map).then(function (response) {
                alert("Updated map");
                console.log(response.data);
            }, function (response) {
                console.log(response);
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });
        } else {
            $http.post("/api/maps/line", map).then(function (response) {
                alert("Created map!");
                console.log(response.data);
                window.location.replace("/admin/" + competitionId + "/line/editor/" + response.data.id)
            }, function (response) {
                console.log(response);
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });
        }
    }

    $scope.export = function () {
        
        var victims = {};
        victims.live = $scope.liveV;
        victims.dead = $scope.deadV;
        
        var map = {
            name: $scope.name,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            finished: $scope.finished,
            numberOfDropTiles: $scope.numberOfDropTiles,
            startTile: $scope.startTile,
            tiles: $scope.tiles,
            victims: victims
        };
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(map))
        var downloadLink = document.createElement('a')
        document.body.appendChild(downloadLink);
        downloadLink.setAttribute("href", dataStr)
        downloadLink.setAttribute("download", $scope.name + '.json')
        downloadLink.click()
        document.body.removeChild(downloadLink);
    }

    // File APIに対応しているか確認
    if (window.File) {
        var select = document.getElementById('select');

        // ファイルが選択されたとき
        select.addEventListener('change', function (e) {
            // 選択されたファイルの情報を取得
            var fileData = e.target.files[0];

            var reader = new FileReader();
            // ファイル読み取りに失敗したとき
            reader.onerror = function () {
                alert('ファイル読み取りに失敗しました')
            }
            // ファイル読み取りに成功したとき
            reader.onload = function () {
                var data = JSON.parse(reader.result);
                $scope.tiles = data.tiles;
                $scope.competitionId = competitionId;

                $scope.startTile = data.startTile;
                $scope.numberOfDropTiles = data.numberOfDropTiles;
                $scope.height = data.height;
                $scope.width = data.width;
                $scope.length = data.length;
                $scope.name = data.name;
                $scope.finished = data.finished;

                $scope.liveV = data.victims.live;
                $scope.deadV = data.victims.dead;
                /*for (let i = 0; i < data.tiles.length; i++) {
                    $scope.tiles[data.tiles[i].x + ',' +
                        data.tiles[i].y + ',' +
                        data.tiles[i].z] = data.tiles[i];
                }*/
                $scope.$apply();
            }

            // ファイル読み取りを実行
            reader.readAsText(fileData);
        }, false);
    }


    $scope.open = function (x, y) {
        // If the tile doesn't exists yet
        if (!$scope.tiles[x + ',' + y + ',' + $scope.z]) {
            swal("Oops!", "Need to place a tile here before changing it.", "error");
            return;
        }

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/line_editor_modal.html?gs',
            controller: 'ModalInstanceCtrl',
            size: 'sm',
            resolve: {
                tile: function () {
                    return $scope.tiles[x + ',' + y + ',' + $scope.z];
                },
                start: function () {
                    return $scope.startTile.x == x && $scope.startTile.y == y &&
                        $scope.startTile.z == $scope.z;
                }
            }
        });

        modalInstance.result.then(function (response) {
            if (response) {
                $scope.startTile.x = x;
                $scope.startTile.y = y;
                $scope.startTile.z = $scope.z;
            }

        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };
}]);


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, tile, start) {
    $scope.tile = tile;
    $scope.start = start;
    $scope.ok = function () {
        $uibModalInstance.close($scope.start);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});


app.directive('ngRightClick', function ($parse) {
    return function (scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function (event) {
            scope.$apply(function () {
                event.preventDefault();
                fn(scope, {
                    $event: event
                });
            });
        });
    };
});


app.directive('tile', function () {
    return {
        scope: {
            tile: '='
        },
        restrict: 'E',
        templateUrl: '/templates/tile.html',
        link: function (scope, element, attrs) {
            scope.tilerotate = function (tilerot) {
                return tilerot;
            }
            scope.rotateRamp = function (direction) {
                switch (direction) {
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
            scope.isStart = function (tile) {
                //console.log(tile);
                return attrs.x == scope.$parent.startTile.x &&
                    attrs.y == scope.$parent.startTile.y &&
                    attrs.z == scope.$parent.startTile.z;
            }

        }
    };
});


app.directive('rotateOnClick', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var deg = 0;
            element.bind('click', function () {
                element.removeClass('rot' + deg);
                deg += 90;
                if (deg >= 360)
                    deg = 0;
                element.addClass('rot' + deg);
                element.attr("rot", deg);
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
                e.dataTransfer = e.originalEvent.dataTransfer;
                e.dataTransfer.setData('text', id);
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
                e.dataTransfer = e.originalEvent.dataTransfer;
                e.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.
                return false;
            });

            el.bind("dragenter", function (e) {
                // this / e.target is the current hover target.
                angular.element(e.target).addClass('lvl-over');
            });

            el.bind("dragleave", function (e) {
                angular.element(e.target).removeClass('lvl-over'); // this / e.target is previous target element.
            });

            el.bind("drop", function (e) {
                if (e.preventDefault) {
                    e.preventDefault(); // Necessary. Allows us to drop.
                }

                if (e.stopPropagation) {
                    e.stopPropagation(); // Necessary. Allows us to drop.
                }
                e.dataTransfer = e.originalEvent.dataTransfer;
                var data = e.dataTransfer.getData("text");
                var dest = document.getElementById(id);
                var src = document.getElementById(data);
                var drop = angular.element(dest); // The div where i dropped the tile
                var drag = angular.element(src); // The div where I lifted this tile


                // If we dropped something on an image this is back to the tool box
                if (drop[0].tagName == "IMG") {
                    // Remove the element from where we dragged it
                    delete scope.tiles[drag.attr("x") + "," + drag.attr("y") + "," +
                    drag.attr("z")];
                } else if (drag[0].tagName == "IMG") { // If we drag out an image, this is a new tile

                    scope.tiles[drop.attr("x") + "," + drop.attr("y") + "," +
                    drop.attr("z")] = {
                        rot: +drag.attr("rot"),
                        tileType: scope.tileSet.tiles.find(function (t) {
                            return t.tileType._id == drag.attr("tile-id")
                        }).tileType,
                        items: {
                            obstacles: 0,
                            speedbumps: 0,
                            noCheckPoint: false,
                            rampPoints: false
                        }
                    };
                    // We dragged an non-existing tile
                } else if (!scope.tiles[drag.attr("x") + "," + drag.attr("y") + "," +
                    drag.attr("z")]) {
                    // Just ignore!
                    ;
                } else if (drag.attr("x") != drop.attr("x") ||
                    drag.attr("y") != drop.attr("y") ||
                    drag.attr("z") != drop.attr("z")) {
                    scope.tiles[drop.attr("x") + "," + drop.attr("y") + "," +
                    drop.attr("z")] =
                        scope.tiles[drag.attr("x") + "," + drag.attr("y") + "," +
                        drag.attr("z")];
                    // Remove the element from where we dragged it
                    delete scope.tiles[drag.attr("x") + "," + drag.attr("y") + "," +
                    drag.attr("z")];
                }
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

