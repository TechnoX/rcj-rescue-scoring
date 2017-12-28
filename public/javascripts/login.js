//- -*- tab-width: 2 -*-

var app = angular.module('login', ['ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);

app.controller('loginController', ['$scope', '$log', '$timeout', '$http', '$translate', function ($scope, $log, $timeout, $http, $translate) {
    $scope.isFailed = false;
    $scope.return = false;
    var return_path = ""
    var match = location.search.match(/page=(.*?)(&|$)/);
    if (match) {
        return_path = decodeURIComponent(match[1]);
    }
    if(return_path != "") $scope.return = true;  
    $scope.go = function (path) {
        window.location = path
    }
  $scope.login = function () {
    $http.post("/api/auth/login", {
      username: $scope.username,
      password: $scope.password
    }).then(function (response) {
      window.location.replace('')
    }, function () {
      $scope.isFailed = true;
    })
  }
}])