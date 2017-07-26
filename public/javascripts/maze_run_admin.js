var socket;
angular.module("RunAdmin", ['ngAnimate', 'ui.bootstrap', 'ui.bootstrap.datetimepicker']).controller('RunAdminController', ['$scope', '$http', '$log', '$location', function ($scope, $http, $log, $location) {
  $scope.competitionId = competitionId

  updateRunList();

  (function launchSocketIo() {
    // launch socket.io
    socket = io.connect(window.location.origin);
    socket.emit('subscribe', 'competition/' + competitionId);
    socket.on('changed', function (data) {
      updateRunList();
    });
  })();
  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })

  $http.get("/api/competitions/" + competitionId +
            "/Maze/teams").then(function (response) {
    $scope.teams = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/Maze/rounds").then(function (response) {
    $scope.rounds = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/Maze/fields").then(function (response) {
    $scope.fields = response.data
  })
  $http.get("/api/competitions/" + competitionId +
            "/Maze/maps").then(function (response) {
    $scope.maps = response.data
  })

  $scope.addRun = function () {
    if ($scope.run === undefined ||
        $scope.run.round === undefined ||
        $scope.run.team === undefined ||
        $scope.run.map === undefined ||
        $scope.run.field === undefined) {
      return
    }

    var run = {
      round      : $scope.run.round._id,
      team       : $scope.run.team._id,
      field      : $scope.run.field._id,
      map        : $scope.run.map._id,
      competition: competitionId,
      startTime  : $scope.startTime.getTime()
    }

    console.log(run)

    $http.post("/api/runs/maze", run).then(function (response) {
      console.log(response)
      updateRunList()
    }, function (error) {
      console.log(error)
      swal("Oops!", error.data.err, "error");
    })
  }

  $scope.removeRun = function (run) {
    swal({
      title             : "Delete Run?",
      text              : "Are you sure you want to remove the run?",
      type              : "warning",
      showCancelButton  : true,
      confirmButtonText : "Yes, delete it!",
      confirmButtonColor: "#ec6c62"
    }, function () {
      $http.delete("/api/runs/maze/" + run._id).then(function (response) {
        console.log(response)
        updateRunList()
      }, function (error) {
        console.log(error)
      })
    });
  }

  function updateRunList() {
    $http.get("/api/competitions/" + competitionId +
              "/maze/runs?populate=true").then(function (response) {
      $scope.runs = response.data
    })
  }

  $scope.go_sign = function (runid) {
    swal({
      title             : "Go sign page?",
      text              : "Are you sure you want to go sign page? If you click 'GO', the signatures will remove.",
      type              : "warning",
      showCancelButton  : true,
      confirmButtonText : "GO!",
      confirmButtonColor: "#ec6c62"
    }, function () {
      $scope.go('/maze/sign/' + runid + '/');
    });
  }

  $scope.go_judge = function (runid) {
    swal({
      title             : "Go judge page?",
      text              : "Are you sure you want to go judge page? If you click 'GO', the time and signatures will remove.",
      type              : "warning",
      showCancelButton  : true,
      confirmButtonText : "GO!",
      confirmButtonColor: "#ec6c62"
    }, function () {
      $scope.go('/maze/judge/' + runid + '/');
    });
  }

  $scope.go_approval = function (runid) {
    swal({
      title             : "Go approval page?",
      text              : "Are you sure you want to go approval page?",
      type              : "warning",
      showCancelButton  : true,
      confirmButtonText : "GO!",
      confirmButtonColor: "#ec6c62"
    }, function () {
      $scope.go('/admin/approval/' + runid + '/');
    });
  }

  $scope.go = function (path) {
    window.location = path
  }

  $scope.format = "yyyy-MM-dd"


  var start = new Date(Date.now() + 1000 * 60 * 5)
  start.setMinutes(start.getMinutes() - start.getMinutes() % 5)
  start.setSeconds(0)
  start.setMilliseconds(0)


  $scope.startTime = start
  $scope.startDate = start

  $scope.startDatePopup = {
    opened: false
  }
  $scope.openStartDate = function () {
    $scope.startDatePopup.opened = true
  }
  $scope.updateStartTime = function () {
    $scope.startTime.setFullYear($scope.startDate.getFullYear())
    $scope.startTime.setMonth($scope.startDate.getMonth())
    $scope.startTime.setDate($scope.startDate.getDate())
    $scope.startTime.setSeconds(0)
    $scope.startTime.setMilliseconds(0)

    $scope.startDate.setHours($scope.startTime.getHours())
    $scope.startDate.setMinutes($scope.startTime.getMinutes())
    $scope.startDate.setSeconds(0)
    $scope.startDate.setMilliseconds(0)
  }

}])
  .directive("runsReadFinished", function ($timeout) {
    return function (scope, element, attrs) {
      if (scope.$last) {
        $('.refine').css("visibility", "visible");
        $('.loader').remove();
      }
    }
  })


$(window).on('beforeunload', function () {
  socket.emit('unsubscribe', 'competition/' + competitionId);
});

