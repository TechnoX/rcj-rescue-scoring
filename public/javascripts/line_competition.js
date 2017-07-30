angular.module("LineCompetition", []).controller("LineCompetitionController", function ($scope, $http) {
  $scope.competitionId = competitionId

  function updateTime() {
    $scope.curTime = new Date().getTime()
    setTimeout(updateTime, 1000*60)
  }
  updateTime()

  $scope.show_ended = false

  var showAllRounds = true
  var showAllFields = true

  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })
  
  $scope.update_list = function () {
    $http.get("/api/competitions/" + competitionId +
              "/line/runs?populate=true&minimum=true&ended=" +
              $scope.show_ended).then(function (response) {
      var runs = response.data
      $scope.runs = runs

      // TODO: This should be done with Set, needs polyfill?
      var rounds = {}
      var fields = {}
      for (var i = 0; i < runs.length; i++) {
        var round = runs[i].round.name
        var field = runs[i].field.name

        if (!rounds.hasOwnProperty(round)) {
          if ($scope.rounds.hasOwnProperty(round)) {
            rounds[round] = $scope.rounds[round]
          } else {
            rounds[round] = false
          }
        }
        if (!fields.hasOwnProperty(field)) {
          if ($scope.fields.hasOwnProperty(field)) {
            fields[field] = $scope.fields[field]
          } else {
            fields[field] = false
          }
        }
      }

      $scope.rounds = rounds
      $scope.fields = fields

      //console.log($scope.teams)
    })
  }

  $scope.$watch('rounds', function (newValue, oldValue) {
    showAllRounds = true
    for (let round in newValue) {
      if (newValue.hasOwnProperty(round)) {
        if (newValue[round]) {
          showAllRounds = false
          return
        }
      }
    }
  }, true)
  $scope.$watch('fields', function (newValue, oldValue) {
    showAllFields = true
    for (let field in newValue) {
      if (newValue.hasOwnProperty(field)) {
        if (newValue[field]) {
          showAllFields = false
          return
        }
      }
    }
  }, true)

  $scope.update_list()

  $scope.list_filter = function (value, index, array) {
    return (showAllRounds || $scope.rounds[value.round.name]) &&
           (showAllFields || $scope.fields[value.field.name])
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
