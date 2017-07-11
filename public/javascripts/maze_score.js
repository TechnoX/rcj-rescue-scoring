angular.module("MazeScore", ['datatables']).controller("MazeScoreController", function ($scope, $http) {
  $scope.competitionId = competitionId

  launchSocketIo()
  updateRunList()

  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })

  function updateRunList() {
    $http.get("/api/competitions/" + competitionId +
              "/maze/runs?populate=true").then(function (response) {
      var runs = response.data

      console.log(runs)

      $scope.mazeRuns = []
      var mazeTeamRuns = {}

      for (var i in runs) {
        var run = runs[i]

        if (run.score != 0 || run.time.minutes != 0 || run.time.seconds != 0) {
          $scope.mazeRuns.push(run)
          if (mazeTeamRuns[run.team._id] === undefined) {
            mazeTeamRuns[run.team._id] = {
              team: {name: run.team.name},
              runs: [run]
            }
          } else {
            mazeTeamRuns[run.team._id].runs.push(run)
          }
          var sum = sumBest(mazeTeamRuns[run.team._id].runs)
          mazeTeamRuns[run.team._id].sumScore = sum.score
          mazeTeamRuns[run.team._id].sumTime = sum.time
        }
      }
      $scope.mazeRuns.sort(sortRuns)

      $scope.mazeRunsTop = []
      for (var i in mazeTeamRuns) {
        var teamRun = mazeTeamRuns[i]
        $scope.mazeRunsTop.push({
          team : {name: teamRun.team.name},
          score: teamRun.sumScore,
          time : teamRun.sumTime
        })
      }
      $scope.mazeRunsTop.sort(sortRuns)
    })
  }

  function launchSocketIo() {
    // launch socket.io
    var socket = io.connect(window.location.origin)
    socket.on('connect', function () {
      socket.emit('subscribe', 'runs/maze')
    })
    socket.on('changed', function () {
      updateRunList()
    })
  }

  function sumBest(runs) {
    if (runs.length == 1) {
      return runs[0]
    }

    runs.sort(sortRuns)

    return {
      score: runs[0].score + runs[1].score,
      time : {
        minutes: runs[0].time.minutes + runs[1].time.minutes +
                 (runs[0].time.seconds + runs[1].time.seconds >= 60 ? 1 : 0),
        seconds: (runs[0].time.seconds + runs[1].time.seconds) % 60
      }
    }
  }

  function sortRuns(a, b) {
    if (a.score == b.score) {
      if (a.time.minutes < b.time.minutes) {
        return -1
      } else if (a.time.minutes > b.time.minutes) {
        return 1
      } else {
        if (a.time.seconds < b.time.seconds) {
          return -1
        } else if (a.time.seconds > b.time.seconds) {
          return 1
        } else {
          return 0
        }
      }
    } else {
      return b.score - a.score
    }
  }
})