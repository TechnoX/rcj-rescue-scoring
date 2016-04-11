angular.module("Home", []).controller("HomeController", function ($scope, $http) {

  var newMap = {
    "name"  : "Test8",
    "height": 2,
    "width" : 3,
    "length": 4,
    "tiles" : [{
      "x"    : 1,
      "y"    : 2,
      "z"    : 3,
      "rot"  : 0,
      "items": {"gaps": 1, "obstacles": 2, "speedbumps": 3, "intersections": 4},
      "tileType" : "5702e08ba5da22703882ed78"
    }, {
      "x"    : 2,
      "y"    : 3,
      "z"    : 4,
      "rot"  : 180,
      "items": {"gaps": 2, "obstacles": 5, "speedbumps": 3, "intersections": 4},
      "tileType" : "5702e08ba5da22703882ed78"
    }]
  }

  $http.post("/api/maps/createmap", {map: newMap}).then(function (response) {
    console.log(response)
  }, function (error) {
    console.log(error)
  })
})