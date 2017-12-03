// register the directive with your app module
var app = angular.module('MazeEditor', ['ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);

// function referenced by the drop target
app.controller('MazeEditorController', ['$scope', '$uibModal', '$log', '$http','$translate', function ($scope, $uibModal, $log, $http, $translate) {

    $scope.competitionId = competitionId;
    $scope.mapId = mapId;
    $translate('admin.mazeMapEditor.import').then(function (val) {
        $("#select").fileinput({'showUpload':false, 'showPreview':false, 'showRemove':false, 'showCancel':false  ,'msgPlaceholder': val,allowedFileExtensions: ['json'] , msgValidationError: "ERROR"});
    }, function (translationId) {
        // = translationId;
    });
    $http.get("/api/competitions/").then(function (response) {
        $scope.competitions = response.data
        console.log($scope.competitions)
        $scope.se_competition = competitionId
    })
    $http.get("/api/competitions/" + $scope.competitionId + "/maze/maps").then(function (response) {
        $scope.maps = {}
        for (let i = 0; i < response.data.length; i++) {
            if (response.data[i].parent == mapId || response.data[i]._id == mapId) {
                $scope.maps[i] = response.data[i]
            }
        }
    })

    $scope.z = 0;
    $scope.startTile = {
        x: 0,
        y: 0,
        z: 0
    };
    $scope.height = 1;
    $scope.width = 1;
    $scope.length = 1;
    $scope.name = "Awesome Testbana";
    $scope.cells = {};
    $scope.dice = [];
    $scope.saveasname ="";
    
    $http.get("/api/competitions/" +
        $scope.competitionId).then(function (response) {
        $scope.competition = response.data.name;
    })

    if (mapId) {
        
        $http.get("/api/maps/maze/" + mapId +
            "?populate=true").then(function (response) {
            console.log(response.data);
            $scope.startTile = response.data.startTile;
            $scope.height = response.data.height;
            $scope.width = response.data.width;
            $scope.length = response.data.length;
            $scope.name = response.data.name;
            $scope.finished = response.data.finished;
            $scope.competitionId = response.data.competition;


            try {
                $scope.parent = response.data.parent;
            } catch (e) {
                $scope.parent = "";
            }
            if (response.data.dice) {
                $scope.dice = response.data.dice;
            } else {
                $scope.dice = [];
                for (let i = 0; i < 6; i++) {
                    $scope.dice[i] = mapId
                }
            }




            for (var i = 0; i < response.data.cells.length; i++) {
                $scope.cells[response.data.cells[i].x + ',' +
                    response.data.cells[i].y + ',' +
                    response.data.cells[i].z] = response.data.cells[i];

            }

        });
    }
    

    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }
    
    $scope.changeFloor = function (z){
        $scope.z = z;
    }

    $scope.$watchCollection('startTile', function (newValue, oldValue) {
        // If initialization
        if (newValue === oldValue)
            return;
        if ($scope.cells[oldValue.x + ',' + oldValue.y + ',' + oldValue.z])
            $scope.cells[oldValue.x + ',' + oldValue.y + ',' +
                oldValue.z].tile.checkpoint = false;
        $scope.cells[newValue.x + ',' + newValue.y + ',' +
            newValue.z].tile.checkpoint = true;
        $scope.recalculateLinear();
    });

    $scope.isUndefined = function (thing) {
        return (typeof thing === "undefined");
    }
    $scope.recalculateLinear = function () {
        //console.log($scope.cells);
        if ($scope.startNotSet())
            return;

        // Reset all previous linear walls
        for (var index in $scope.cells) {
            $scope.cells[index].isLinear = false;
        }

        // Start it will all 4 walls around the starting tile
        
        recurs($scope.startTile.x - 1, $scope.startTile.y, $scope.startTile.z);
        recurs($scope.startTile.x + 1, $scope.startTile.y, $scope.startTile.z);
        recurs($scope.startTile.x, $scope.startTile.y - 1, $scope.startTile.z);
        recurs($scope.startTile.x, $scope.startTile.y + 1, $scope.startTile.z);

        for (var index in $scope.cells) {
            if($scope.cells[index].x != null &&$scope.cells[index].tile != null && $scope.cells[index].tile.changeFloorTo != null && $scope.cells[index].tile.changeFloorTo != $scope.cells[index].z){
                recurs($scope.cells[index].x-1, $scope.cells[index].y, $scope.cells[index].tile.changeFloorTo);
                recurs($scope.cells[index].x+1, $scope.cells[index].y, $scope.cells[index].tile.changeFloorTo);
                recurs($scope.cells[index].x1, $scope.cells[index].y-1, $scope.cells[index].tile.changeFloorTo);
                recurs($scope.cells[index].x-1, $scope.cells[index].y+1, $scope.cells[index].tile.changeFloorTo);
            }
        }
    }

    function isOdd(num) {
        return num % 2;
    }

    function recurs(x, y, z) {
        if (x < 0 || y < 0 || z < 0) {
            return;
        }

        var cell = $scope.cells[x + ',' + y + ',' + z];
        
        // If this is a wall that doesn't exists
        if (!cell)
            return;
        // Outside of the current maze size. 
        if (x > $scope.width * 2 + 1 || x < 0 ||
            y > $scope.length * 2 + 1 || y < 0 ||
            z > $scope.height || z < 0)
            return;

        // Already visited this, returning
        if (cell.isLinear)
            return;
        if (cell.isWall) {
            cell.isLinear = true;


            // horizontal walls
            if (isOdd(x) && !isOdd(y)) {
                // Set tiles around this wall to linear
                setTileLinear(x - 2, y - 1, z);
                setTileLinear(x, y - 1, z);
                setTileLinear(x + 2, y - 1, z);
                setTileLinear(x - 2, y + 1, z);
                setTileLinear(x, y + 1, z);
                setTileLinear(x + 2, y + 1, z);
                // Check neighbours
                recurs(x + 2, y, z);
                recurs(x - 2, y, z);
                recurs(x - 1, y - 1, z);
                recurs(x - 1, y + 1, z);
                recurs(x + 1, y - 1, z);
                recurs(x + 1, y + 1, z);
            } // Vertical wall
            else if (!isOdd(x) && isOdd(y)) {
                // Set tiles around this wall to linear
                setTileLinear(x - 1, y - 2, z);
                setTileLinear(x - 1, y, z);
                setTileLinear(x - 1, y + 2, z);
                setTileLinear(x + 1, y - 2, z);
                setTileLinear(x + 1, y, z);
                setTileLinear(x + 1, y + 2, z);
                // Check neighbours
                recurs(x, y - 2, z);
                recurs(x, y + 2, z);
                recurs(x - 1, y - 1, z);
                recurs(x - 1, y + 1, z);
                recurs(x + 1, y - 1, z);
                recurs(x + 1, y + 1, z);
            }
            
        }
    }

    function setTileLinear(x, y, z) {
        if (x < 0 || y < 0 || z < 0) {
            return;
        }

        // Check that this is an actual tile, not a wall
        var cell = $scope.cells[x + ',' + y + ',' + z];
        if (cell) {
            cell.isLinear = true;
        } else {
            $scope.cells[x + ',' + y + ',' + z] = {
                isTile: true,
                isLinear: true,
                tile: {
                    changeFloorTo: z
                }
            };
        }
    }

    $scope.startNotSet = function () {
        return $scope.startTile.x == 0 && $scope.startTile.y == 0 &&
            $scope.startTile.z == 0;
    }


    $scope.childNew = function (num) {
        if ($scope.startNotSet()) {
            alert("You must define a starting tile by clicking a tile");
            return;
        }
        var map = {
            competition: $scope.competitionId,
            name: $scope.name,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            finished: $scope.finished,
            startTile: $scope.startTile,
            cells: $scope.cells
        };
        console.log(map);
        console.log("Update map", mapId);
        console.log("Competition ID", $scope.competitionId);
        if (mapId) {
            $http.put("/api/maps/maze/" + mapId, map).then(function (response) {
                console.log(response.data);
            }, function (response) {
                console.log(response);
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });
        } else {
            $http.post("/api/maps/maze", map).then(function (response) {
                console.log(response.data);
            }, function (response) {
                console.log(response);
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });
        }


        if ($scope.startNotSet()) {
            alert("You must define a starting tile by clicking a tile");
            return;
        }


        var map = {
            competition: $scope.competitionId,
            parent: $scope.mapId,
            name: $scope.name + " - Pattern: " + num,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            finished: $scope.finished,
            startTile: $scope.startTile,
            cells: $scope.cells
        };
        $http.post("/api/maps/maze", map).then(function (response) {
            console.log(response.data);
            $scope.dice[num-1] = response.data.id;
            $scope.saveMap($scope.dice[num-1]);
        }, function (response) {
            console.log(response);
            console.log("Error: " + response.statusText);
            alert(response.data.msg);
        });
        
        
    }

    $scope.saveMapAs = function (name) {
        if ($scope.startNotSet()) {
            alert("You must define a starting tile by clicking a tile");
            return;
        }
        console.log($scope.se_competition);
        console.log(competitionId);

        if (name == $scope.name && $scope.se_competition == competitionId) {
            alert("You must have a new name when saving as!");
            return;
        }


        var map = {
            competition: $scope.se_competition,
            name: name,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            finished: $scope.finished,
            startTile: $scope.startTile,
            cells: $scope.cells
        };
        console.log(map);
        $http.post("/api/maps/maze", map).then(function (response) {
            alert("Created map!");
            console.log(response.data);
            window.location.replace("/admin/" + $scope.se_competition + "/maze/editor/" + response.data.id)
        }, function (response) {
            console.log(response);
            console.log("Error: " + response.statusText);
            alert(response.data.msg);
        });
    }

    $scope.saveMap = function (loc) {
        if ($scope.startNotSet()) {
            alert("You must define a starting tile by clicking a tile");
            return;
        }
        var map = {
            competition: $scope.competitionId,
            dice: $scope.dice,
            name: $scope.name,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            finished: $scope.finished,
            startTile: $scope.startTile,
            cells: $scope.cells
        };
        console.log("Update map", mapId);
        console.log("Competition ID", $scope.competitionId);
        if (mapId) {
            $http.put("/api/maps/maze/" + mapId, map).then(function (response) {
                if (!loc) alert("Updated map");
                console.log(response.data);
                if (loc) window.location.replace("/admin/" + competitionId + "/maze/editor/" + loc)
            }, function (response) {
                console.log(response);
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });
        } else {
            $http.post("/api/maps/maze", map).then(function (response) {
                alert("Created map!");
                console.log(response.data);
                if (loc) window.location.replace("/admin/" + competitionId + "/maze/editor/" + loc)
                else window.location.replace("/admin/" + competitionId + "/maze/editor/" + response.data.id)

            }, function (response) {
                console.log(response);
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });
        }
    }
    
    $scope.export = function(){
        console.log($scope.cells)
        var map = {
            name: $scope.name,
            length: $scope.length,
            height: $scope.height,
            width: $scope.width,
            finished: $scope.finished,
            startTile: $scope.startTile,
            cells: $scope.cells
        };
         var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(map))
         var downloadLink = document.createElement('a')
         document.body.appendChild(downloadLink);
         downloadLink.setAttribute("href",dataStr)
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
                    $scope.cells = data.cells;
                    $scope.competitionId = competitionId;

                    $scope.startTile = data.startTile;
                    $scope.numberOfDropTiles = data.numberOfDropTiles;
                    $scope.height = data.height;
                    $scope.width = data.width;
                    $scope.length = data.length;
                    $scope.name = data.name;
                    $scope.finished = data.finished;
                    $scope.$apply();
                }

                // ファイル読み取りを実行
                reader.readAsText(fileData);
            }, false);
        }


    $scope.cellClick = function (x, y, z, isWall, isTile) {

        var cell = $scope.cells[x + ',' + y + ',' + z];

        // If wall 
        if (isWall) {
            if (!cell) {
                $scope.cells[x + ',' + y + ',' + z] = {
                    isWall: true
                };
            } else {
                cell.isWall = !cell.isWall;
            }
            $scope.recalculateLinear();
        } else if (isTile) {
            if (!cell) {
                $scope.cells[x + ',' + y + ',' + z] = {
                    isTile: true,
                    tile: {
                        changeFloorTo: z
                    }
                };
            }
            $scope.open(x, y, z);
        }
    }

    $scope.open = function (x, y, z) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: '/templates/maze_editor_modal.html',
            controller: 'ModalInstanceCtrl',
            size: 'sm',
            scope: $scope,
            resolve: {
                x: function () {
                    return x;
                },
                y: function () {
                    return y;
                },
                z: function () {
                    return z;
                }
            }
        });
    };
}]);


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, x, y, z) {
    $scope.cell = $scope.$parent.cells[x + ',' + y + ',' + z];
    $scope.isStart = $scope.$parent.startTile.x == x &&
        $scope.$parent.startTile.y == y &&
        $scope.$parent.startTile.z == z;
    $scope.height = $scope.$parent.height;
    $scope.z = z;
    $scope.oldFloorDestination = $scope.cell.tile.changeFloorTo;
    $scope.elevatorChanged = function (newValue) {
        console.log("old", $scope.oldFloorDestination);
        console.log("new", newValue);
        // Remove the old one
        if ($scope.oldFloorDestination != z &&
            $scope.$parent.cells[x + ',' + y + ',' + $scope.oldFloorDestination]) {
            console.log("Remove old elevator on " + x + ',' + y + ',' +
                $scope.oldFloorDestination);
            $scope.$parent.cells[x + ',' + y + ',' +
                $scope.oldFloorDestination].tile.changeFloorTo = $scope.oldFloorDestination;
        }

        // Set the new one
        if ($scope.$parent.cells[x + ',' + y + ',' + newValue]) {
            console.log("Create new elevator on " + x + ',' + y + ',' + newValue +
                " (1) to floor " + z);
            $scope.$parent.cells[x + ',' + y + ',' + newValue].tile.changeFloorTo = z;
        } else {
            console.log("Create new elevator on " + x + ',' + y + ',' + newValue +
                " (2) to floor " + z);
            $scope.$parent.cells[x + ',' + y + ',' + newValue] = {
                isTile: true,
                tile: {
                    changeFloorTo: z
                }
            };
        }
        $scope.oldFloorDestination = newValue;
        $scope.recalculateLinear();
    }

    $scope.startChanged = function () {
        if ($scope.isStart) {
            $scope.$parent.startTile.x = x;
            $scope.$parent.startTile.y = y;
            $scope.$parent.startTile.z = z;
        }
    }

    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }
    $scope.ok = function () {
        $uibModalInstance.close();
    };
});
