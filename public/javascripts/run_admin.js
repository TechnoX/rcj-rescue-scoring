angular.module("RunAdmin", []).controller("RunAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateRunList()

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
  $http.get("/api/maps").then(function (response) {
    $scope.maps = response.data
  })

  $scope.addRun = function () {
    if ($scope.run === undefined ||
        $scope.run.round === undefined ||
        $scope.run.team === undefined ||
        $scope.run.map === undefined ||
        $scope.run.field === undefined) {
      return
    }

    var run = {
      round      : $scope.run.round._id,
      team       : $scope.run.team._id,
      field      : $scope.run.field._id,
      map        : $scope.run.map._id,
      competition: competitionId
    }

    console.log(run)

    $http.post("/api/runs/createrun", run).then(function (response) {
      console.log(response)
      updateRunList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeRun = function (run) {
    if (confirm("Are you sure you want to remove the run: "  + '?')) {
      $http.get("/api/runs/" + run._id + "/delete").then(function (response) {
        console.log(response)
        updateRunList()
      }, function (error) {
        console.log(error)
      })
    }
  }

  function updateRunList() {
    $http.get("/api/competitions/" + competitionId +
              "/runs?populate=true").then(function (response) {
      $scope.runs = response.data
      console.log($scope.teams)
    })
  }
})