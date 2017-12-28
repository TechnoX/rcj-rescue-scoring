var app = angular.module("Home", ['pascalprecht.translate', 'ngCookies']).controller("HomeController", function ($scope, $http) {
    
    $scope.go = function (path) {
        window.location = path
    }
});
