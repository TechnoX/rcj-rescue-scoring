var app = angular.module("TilesetAdmin", ['ngTouch','pascalprecht.translate', 'ngCookies']).controller("TilesetAdminController", function ($scope, $http) {

    function updateTileSetList(callback) {
        $http.get("/api/maps/line/tilesets?populate=true").then((response) => {
            $scope.tileSets = response.data
            $scope.tileSet = $scope.tileSets[0]
            $scope.translationData = {
                setName: $scope.tileSet.name
            };

            if (callback != null) {
                callback()
            }
        })
    }
    updateTileSetList()
    
    $scope.$watch('tileSet.name', function(newValue, oldValue, scope) {
        try{
        scope.translationData = {
                setName: scope.tileSet.name
            };
        }
        catch(e){
            
        }
    });

    
    $scope.go = function (path) {
        window.location = path
    }

    $http.get("/api/maps/line/tiletypes").then((response) => {
        $scope.tileTypes = response.data
    })

    $scope.addTile = function (tileType) {

        // Check if tileType already exists in tileSet
        var result = $scope.tileSet.tiles.filter(
            (tile) => tile.tileType._id == tileType._id
        )

        if (result.length == 0) {
            $scope.tileSet.tiles.push({
                tileType: tileType,
                count: 1
            })
        } else {
            result[0].count++
        }
    }

    $scope.removeTile = function (tile) {
        var tileToRemove = tile

        tileToRemove.count--

            if (tileToRemove.count <= 0) {
                $scope.tileSet.tiles = $scope.tileSet.tiles.filter(
                    (tile) => tile.tileType._id != tileToRemove.tileType._id
                )
            }
    }

    $scope.createNewTileSet = function () {
        const newName = $scope.newTileSetName
        $http.post("/api/maps/line/tilesets", {
            name: newName
        }).then(
            (response) => {
                $scope.newTileSetName = ""
                updateTileSetList(() => {
                    const newTileSet = $scope.tileSets.filter((tileSet) => tileSet.name ==
                        newName)
                    if (newTileSet.length > 0) {
                        $scope.tileSet = newTileSet[0]
                    }
                })
            }, (error) => {
                console.error(error)
            })
    }

    $scope.save = function () {
        $http.put("/api/maps/line/tilesets/" +
            $scope.tileSet._id, $scope.tileSet).then(
            (response) => {
                console.log("Saved!")
            }, (error) => {
                console.error(error)
            })
    }

    $scope.delete = function () {
        if (confirm("Are you sure you want to remove the tileset: " +
                $scope.tileSet.name + "?")) {
            $http.delete("/api/maps/line/tilesets/" +
                $scope.tileSet._id).then((response) => {
                updateTileSetList()
            }, (error) => {
                console.error(error)
            })
        }
    }
})
