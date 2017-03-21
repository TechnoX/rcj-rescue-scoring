angular.module("LineCompetition", []).controller("LineCompetitionController", function ($scope, $http) {
  $scope.competitionId = competitionId

  $http.get("/api/competitions/" + competitionId +
            "/line/runs?populate=true").then(function (response) {
    $scope.runs = response.data
    console.log($scope.teams)
  })

  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })

  $http.get("/api/competitions/" + competitionId +
            "/teams").then(function (response) {
    $scope.teams = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/rounds").then(function (response) {
    $scope.rounds = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/fields").then(function (response) {
    $scope.fields = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/line/maps").then(function (response) {
    $scope.maps = response.data
  })
})
