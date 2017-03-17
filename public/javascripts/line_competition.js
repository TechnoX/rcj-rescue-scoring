angular.module("LineCompetition", []).controller("LineCompetitionController", function ($scope, $http) {
  $scope.competitionId = competitionId

  $http.get("/api/competitions/" + competitionId +
            "/runs?populate=true").then(function (response) {
    $scope.runs = response.data
    console.log($scope.teams)
  })

  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })

  $http.get("/api/competitions/" + competitionId +
            "/teams").then(function (response) {
    $scope.teams = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/rounds").then(function (response) {
    $scope.rounds = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/fields").then(function (response) {
    $scope.fields = response.data
  })
  $http.get("/api/maps").then(function (response) {
    $scope.maps = response.data
  })
  
  $scope.go = function(path){
      window.location = path
  }
  
  $scope.go_judge = function(path){
      swal({
          title: "Judge?", 
          text: "審判ページに移動しますか？", 
          type: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes",
        }, function() {
          $scope.go(path);
      }, function (error) {
        console.log(error);
    });
  }
  
  $scope.no_judge = function(){
      swal("Oops!", "選択した競技は，すでに終了しています．競技を編集する場合は，大会責任者・システム管理者にお問い合わせください．", "error");
  }
})
.directive("runsReadFinished", function($timeout){
    return function(scope, element, attrs){
      if (scope.$last){
        $('.refine').css("visibility","visible");
        $('.loader').remove();
        $timeout(function(){
          $('table.comp').exTableFilter({
            filters : {
                0 : {
                    append : {
                        to : 'div.filter-round',
                        type : 'checkbox'
                    }
                },
                2 : {
                    append : {
                        to : 'div.filter-arena',
                        type : 'checkbox'
                    }
                }
            }
          });
        });
      }
    }
})

