angular.module("RoundAdmin", []).controller("RoundAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateRoundList()

  $http.get("/api/competitions/" + competitionId).then(function (response)  {
    $scope.competition = response.data
  })

  $scope.addRound = function () {
    var round = {name: $scope.roundName, competition: competitionId}

    $http.post("/api/rounds/createround", round).then(function (response) {
      console.log(response)
      updateRoundList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeRound = function (id) {
    $http.get("/api/rounds/" + id + "/delete").then(function (response) {
      console.log(response)
      updateRoundList()
    }, function (error) {
      console.log(error)
    })
  }

  function updateRoundList() {
    $http.get("/api/competitions/" + competitionId + "/rounds").then(function (response) {
      $scope.rounds = response.data
      console.log($scope.rounds)
    })
  }
})