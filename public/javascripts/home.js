var app = angular.module("Home", ['pascalprecht.translate', 'ngCookies']).controller("HomeController", function ($scope, $http) {
    
    $scope.go = function (path) {
        window.location = path
    }
    
    $http.get("/api/competitions").then(function (response) {
        $scope.competitions = response.data
        console.log($scope.competitions)
    })
});
