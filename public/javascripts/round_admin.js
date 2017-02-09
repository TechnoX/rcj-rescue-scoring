angular.module("RoundAdmin", []).controller("RoundAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateRoundList()

  $http.get("/api/competitions/" + competitionId).then(function (response)  {
    $scope.competition = response.data
  })

  $http.get("/api/teams/leagues").then(function (response) {
    $scope.leagues = response.data
    console.log($scope.leagues)
  })

  $scope.addRound = function () {
    var round = {name: $scope.roundName, competition: competitionId, league: $scope.roundLeague}

    $http.post("/api/rounds/createround", round).then(function (response) {
      console.log(response)
      updateRoundList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeRound = function (round) {
    if (confirm("Are you sure you want to remove the round: " + round.name + '?')) {
      $http.get("/api/rounds/" + round._id + "/delete").then(function (response) {
        console.log(response)
        updateRoundList()
      }, function (error) {
        console.log(error)
      })
    }
  }

  function updateRoundList() {
    $http.get("/api/competitions/" + competitionId + "/rounds").then(function (response) {
      $scope.rounds = response.data
      console.log($scope.rounds)
    })
  }
})