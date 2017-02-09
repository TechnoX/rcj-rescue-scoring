angular.module("AdminHome", []).controller("AdminHomeController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateCompetitionList()
  //updateMapList()

  $scope.addCompetition = function () {
    var competition = {name: $scope.competitionName}

    $http.post("/api/competitions/createcompetition", competition).then(function (response) {
      console.log(response)
      updateCompetitionList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeCompetition = function (competition) {
    if (confirm("Are you sure you want to remove the competition: " + competition.name + '?')) {
      $http.get("/api/competitions/" + competition._id + "/delete").then(function (response) {
        console.log(response)
        updateCompetitionList()
      }, function (error) {
        console.log(error)
      })
    }
  }

  function updateCompetitionList() {
    $http.get("/api/competitions/").then(function (response) {
      $scope.competitions = response.data
      console.log($scope.competitions)
    })
  }

  $scope.removeMap = function (map) {
    if (confirm("Are you sure you want to remove the map: " + map.name + '?')) {
      $http.get("/api/maps/" + map._id + "/delete").then(function (response) {
        console.log(response)
        updateMapList()
      }, function (error) {
        console.log(error)
      })
    }
  }

  function updateMapList() {
    $http.get("/api/maps/").then(function (response) {
      $scope.maps = response.data
      console.log($scope.maps)
    })
  }
})