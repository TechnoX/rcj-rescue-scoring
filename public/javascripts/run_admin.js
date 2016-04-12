angular.module("RunAdmin", []).controller("RunAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateRunList()

  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })

  $http.get("/api/competitions/" + competitionId + "/teams").then(function (response) {
    $scope.teams = response.data
  })
  $http.get("/api/competitions/" + competitionId + "/fields").then(function (response) {
    $scope.fields = response.data
  })
  $http.get("/api/maps").then(function (response) {
    $scope.maps = response.data
  })

  $scope.addRun = function () {
    var run = {team: $scope.runTeam, league: $scope.runLeague, field: $scope.runField, competition: competitionId}

    $http.post("/api/runs/createrun", run).then(function (response) {
      console.log(response)
      updateRunList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeRun = function (id) {
    $http.get("/api/runs/" + id + "/delete").then(function (response) {
      console.log(response)
      updateRunList()
    }, function (error) {
      console.log(error)
    })
  }

  function updateRunList() {
    $http.get("/api/competitions/" + competitionId + "/runs?populate=true").then(function (response) {
      $scope.runs = response.data
      console.log($scope.teams)
    })
  }
})