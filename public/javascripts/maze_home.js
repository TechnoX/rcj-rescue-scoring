var app = angular.module("MazeHome", ['pascalprecht.translate', 'ngCookies']);

app.controller("MazeHomeController", function ($scope, $http) {
    $scope.competitionId = competitionId

    $http.get("/api/competitions").then(function (response) {
        $scope.competitions = response.data
        console.log($scope.competitions)
    })

    $scope.go = function (path) {
        window.location = path
    }
})

document.write("<script type='text/javascript' src='/javascripts/translate_config.js'></script>");
