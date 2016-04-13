angular.module("AdminHome", []).controller("AdminHomeController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateCompetitionList()

  $scope.addCompetition = function () {
    var competition = {name: $scope.competitionName}

    $http.post("/api/competitions/createcompetition", competition).then(function (response) {
      console.log(response)
      updateCompetitionList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeCompetition = function (id) {
    $http.get("/api/competitions/" + id + "/delete").then(function (response) {
      console.log(response)
      updateCompetitionList()
    }, function (error) {
      console.log(error)
    })
  }

  function updateCompetitionList() {
    $http.get("/api/competitions/").then(function (response) {
      $scope.competitions = response.data
      console.log($scope.competitions)
    })
  }
})