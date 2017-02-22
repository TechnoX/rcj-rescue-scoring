angular.module("CompetitionAdmin", []).controller("CompetitionAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId

  $http.get("/api/competitions/" + competitionId).then(function (response)  {
    $scope.competition = response.data
  })
})