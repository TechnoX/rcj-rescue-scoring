//- -*- tab-width: 2 -*-

angular.module("login", []).controller("loginController", function($scope, $http) {

  $scope.login = function() {
    $http.post("/api/auth/login",  {username : $scope.username, password : $scope.password}).then(function(response) {
      console.log(response)
      window.location.replace("/home")
    })
  }
})