//- -*- tab-width: 2 -*-

angular.module("login", []).controller("loginController", function($scope, $http) {

  $scope.login = function() {
    $http.post("/api/auth/login",  {username : $scope.username, password : $scope.password}).then(function(response) {
      console.log(response)
      var return_path = ""
      var match = location.search.match(/site=(.*?)(&|$)/);
      if(match){
          return_path = decodeURIComponent(match[1]);
      }
      window.location.replace(return_path)
    },function(){
        swal("Oops!", "ログインに失敗しました．IDとパスワードをお確かめください", "error");
    })
  }
})