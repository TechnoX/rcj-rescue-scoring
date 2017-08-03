angular.module("MazeCompetition", []).controller("MazeCompetitionController", function ($scope, $http) {
  $scope.competitionId = competitionId
  $scope.curTime = new Date().getTime()
  
  $http.get("/api/competitions/" + competitionId +
            "/maze/runs?populate=true&minimum=true&ended=false").then(function (response) {
    $scope.runs = response.data
    //console.log($scope.teams)
  })
  
  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })
  
  $scope.update_list = function () {
    $http.get("/api/competitions/" + competitionId +
              "/maze/runs?populate=true&minimum=true&ended=" +
              $scope.show_ended).then(function (response) {
      $scope.runs = response.data
      //console.log($scope.teams)
    })
  }
  
  $scope.go = function (path) {
    window.location = path
  }
  
  $scope.go_judge = function (path) {
    swal({
      title            : "Judge?",
      text             : "Are you sure to move Judge Page?",
      type             : "warning",
      showCancelButton : true,
      confirmButtonText: "Yes",
    }, function () {
      $scope.go(path);
    }, function (error) {
      console.log(error);
    });
  }
  
  $scope.no_judge = function () {
    swal("Oops!", "The run you selected was already ended! If you need to edit, please contact OC.", "error");
  }
})
  .directive("runsReadFinished", function ($timeout) {
    return function (scope, element, attrs) {
      if (scope.$last) {
        $('.refine').css("visibility", "visible");
        $('.loader').remove();
        $timeout(function () {
          $('table.comp').exTableFilter({
            filters: {
              1: {
                append: {
                  to  : 'div.filter-round',
                  type: 'checkbox'
                }
              },
              3: {
                append: {
                  to  : 'div.filter-arena',
                  type: 'checkbox'
                }
              }
            }
          });
        });
      }
    }
  })
