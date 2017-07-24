angular.module("TeamAdmin", []).controller("TeamAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateTeamList()

  $http.get("/api/competitions/" + competitionId).then(function (response)  {
    $scope.competition = response.data
  })

  $http.get("/api/teams/leagues").then(function (response) {
    $scope.leagues = response.data
    console.log($scope.leagues)
  })

  $scope.addTeam = function () {
    var team = {name: $scope.teamName, league: $scope.teamLeague, competition: competitionId}

    $http.post("/api/teams", team).then(function (response) {
      console.log(response)
      updateTeamList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeTeam = function(team) {
      swal({
          title: "Remove team?", 
          text: "Are you sure you want to remove the team: " + team.name + '?', 
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Remove it!",
          confirmButtonColor: "#ec6c62"
        }, function() {
            $http.delete("/api/teams/" + team._id).then(function (response) {
                console.log(response)
                updateTeamList()
              }, function (error) {
                console.log(error)
              })
         });
  }

  function updateTeamList() {
    $http.get("/api/competitions/" + competitionId + "/teams").then(function (response) {
      $scope.teams = response.data
      console.log($scope.teams)
    })
  }
})