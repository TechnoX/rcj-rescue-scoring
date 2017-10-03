var app = angular.module("LineHome", ['pascalprecht.translate', 'ngCookies']);
app.controller("LineHomeController", function ($scope, $http) {
    $scope.competitionId = competitionId

    $http.get("/api/competitions").then(function (response) {
        $scope.competitions = response.data
        console.log($scope.competitions)
    })

    $scope.go = function (path) {
        window.location = path
    }
});
