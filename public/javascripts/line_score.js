angular.module("LineScore", ['datatables']).controller("LineScoreController", function ($scope, $http) {
  $scope.competitionId = competitionId

  launchSocketIo()
  updateRunList()

  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })

  function updateRunList() {
    $http.get("/api/competitions/" + competitionId +
              "/line/runs?populate=true").then(function (response) {
      var runs = response.data

      console.log(runs)

      $scope.primaryRuns = []
      var primaryTeamRuns = {}
      $scope.secondaryRuns = []
      var secondaryTeamRuns = {}

      for (var i in runs) {
        var run = runs[i]

        if (run.score != 0 || run.time.minutes != 0 || run.time.seconds != 0) {
          if (run.team.league == "Primary") {
            $scope.primaryRuns.push(run)
            if (primaryTeamRuns[run.team._id] === undefined) {
              primaryTeamRuns[run.team._id] = {
                team: {name: run.team.name},
                runs: [run]
              }
            } else {
              primaryTeamRuns[run.team._id].runs.push(run)
            }
            var sum = sumBest(primaryTeamRuns[run.team._id].runs)
            primaryTeamRuns[run.team._id].sumScore = sum.score
            primaryTeamRuns[run.team._id].sumTime = sum.time

          } else if (run.team.league == "Secondary") {
            $scope.secondaryRuns.push(run)
            if (secondaryTeamRuns[run.team._id] === undefined) {
              secondaryTeamRuns[run.team._id] = {
                team: {name: run.team.name},
                runs: [run]
              }
            } else {
              secondaryTeamRuns[run.team._id].runs.push(run)
            }
            var sum = sumBest(secondaryTeamRuns[run.team._id].runs)
            secondaryTeamRuns[run.team._id].sumScore = sum.score
            secondaryTeamRuns[run.team._id].sumTime = sum.time
          }
        }
      }
      $scope.primaryRuns.sort(sortRuns)
      $scope.secondaryRuns.sort(sortRuns)

      $scope.primaryRunsTop = []
      for (var i in primaryTeamRuns) {
        var teamRun = primaryTeamRuns[i]
        $scope.primaryRunsTop.push({
          team : {name: teamRun.team.name},
          score: teamRun.sumScore,
          time : teamRun.sumTime
        })
      }
      $scope.primaryRunsTop.sort(sortRuns)

      $scope.secondaryRunsTop = []
      for (var i in secondaryTeamRuns) {
        var teamRun = secondaryTeamRuns[i]
        $scope.secondaryRunsTop.push({
          team : {name: teamRun.team.name},
          score: teamRun.sumScore,
          time : teamRun.sumTime
        })
      }
      $scope.secondaryRunsTop.sort(sortRuns)
    })
  }

  function launchSocketIo() {
    // launch socket.io
    var socket = io.connect(window.location.origin)
    socket.emit('subscribe', 'runs/')
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