angular.module("AdminHome", []).controller("AdminHomeController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateCompetitionList()

  $scope.addCompetition = function () {
    var competition = {name: $scope.competitionName}

    $http.post("/api/competitions", competition).then(function (response) {
      console.log(response)
      updateCompetitionList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeCompetition = function (competition) {
      swal({
          title: "Remove competition?", 
          text: "Are you sure you want to remove the competition: " + competition.name + '?', 
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Remove it!",
          confirmButtonColor: "#ec6c62"
        }, function() {
            $http.get("/api/competitions/" + competition._id + "/delete").then(function (response) {
                console.log(response)
                updateCompetitionList()
              }, function (error) {
                console.log(error)
              })
         });
  }

  function updateCompetitionList() {
    $http.get("/api/competitions/").then(function (response) {
      $scope.competitions = response.data
      console.log($scope.competitions)
    })
  }
})
