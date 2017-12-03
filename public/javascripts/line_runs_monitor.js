// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var marker = {};
var scp;

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http','$cookies',  function ($scope, $uibModal, $log, $timeout, $http, $cookies) {
  
  $http.get("/api/competitions/" + competitionId +
            "/LineNL/fields").then(function (response) {
            $scope.fields = response.data
            $http.get("/api/competitions/" + competitionId +
            "/LineWL/fields").then(function (response) {
            $scope.fields = $scope.fields.concat(response.data)
        })
        })
    
  $scope.getIframeSrc = function (fieldId) {
    return '/line/view/field/'+ competitionId +'/' + fieldId;
  };
    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }
  
  
  
  
  
  $scope.go = function (path) {
    window.open(path)
  }
  
  
}]);

