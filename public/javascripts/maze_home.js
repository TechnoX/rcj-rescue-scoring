angular.module("MazeHome", []).controller("MazeHomeController", function ($scope, $http) {
  $scope.competitionId = competitionId

  $http.get("/api/competitions").then(function (response) {
    $scope.competitions = response.data
    console.log($scope.competitions)
  })
})