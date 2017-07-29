angular.module("LineHome", []).controller("LineHomeController", function ($scope, $http) {
  $scope.competitionId = competitionId
  
  $http.get("/api/competitions").then(function (response) {
    $scope.competitions = response.data
    console.log($scope.competitions)
  })
  
  $scope.go = function (path) {
    window.location = path
  }
})
