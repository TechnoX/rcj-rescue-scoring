var app = angular.module("AD", ['pascalprecht.translate', 'ngCookies']);

app.controller("ADController", ['$scope', '$http', '$translate', function ($scope, $http, $translate) {
    $scope.go = function (path) {
        window.location = path
    }

}]);
