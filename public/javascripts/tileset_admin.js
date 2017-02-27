angular.module("TilesetAdmin", []).controller("TilesetAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId

  $http.get("/api/competitions/" + competitionId).then((response) => {
    $scope.competition = response.data
  })

  $http.get("/api/competitions/" + competitionId +
            "/line/tilesets?populate=true").then((response) => {
    $scope.tileSets = response.data
    $scope.tileSet = $scope.tileSets[0]
  })

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
        count   : 0
      })
    }
  }

  $scope.removeTile = function (tile) {
    var tileToRemove = tile
    $scope.tileSet.tiles = $scope.tileSet.tiles.filter(
      (tile) => tile.tileType._id != tileToRemove.tileType._id
    )
  }
})