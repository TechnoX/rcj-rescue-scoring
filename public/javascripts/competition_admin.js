var app = angular.module("CompetitionAdmin", ['ngTouch','pascalprecht.translate', 'ngCookies']).controller("CompetitionAdminController", function ($scope, $http) {
    $scope.competitionId = competitionId
    $scope.go = function (path) {
        window.location = path
    }
    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })
})
