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
          text: "Are you sure to move Judge Page?", 
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
      swal("Oops!", "The run you selected was already ended!  If you edit, please contact competition manager.", "error");
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

