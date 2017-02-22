angular.module("LineScore", ['datatables']).controller("LineScoreController", function ($scope, $http) {
  $scope.competitionId = competitionId

  launchSocketIo()
  updateRunList()

  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })

  function updateRunList() {
    $http.get("/api/competitions/" + competitionId +
              "/runs?populate=true").then(function (response) {
      var runs = response.data
      $scope.primaryRuns = []
      var primaryTeamRuns = {}
      $scope.secondaryRuns = []
      var secondaryTeamRuns = {}

      for (var i in runs) {
        var run = runs[i]
        run.LoPsNum=0
        for (var j in runs.LoPs){
            if (runs.LoPs[j] == null){
                runs.LoPs[j]=0
            }
        }
        for (var j in run.LoPs){
            if (run.LoPs[j] == null){
                run.LoPs[j]=0
            }
            run.LoPsNum+=run.LoPs[j]
        }

        if (run.score != 0 || run.time.minutes != 0 || run.time.seconds != 0) {
          if (run.team.league == "primary") {
            $scope.primaryRuns.push(run)
            console.log(run)
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
            primaryTeamRuns[run.team._id].sumRescue = sum.rescued
            primaryTeamRuns[run.team._id].sumLoPs = sum.lops

          } else if (run.team.league == "secondary") {
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
            secondaryTeamRuns[run.team._id].sumRescue = sum.rescued
            secondaryTeamRuns[run.team._id].sumLoPs = sum.lops
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
          time : teamRun.sumTime,
          rescuedVictims : teamRun.sumRescue,
          LoPsNum : teamRun.sumLoPs
        })
      }
      $scope.primaryRunsTop.sort(sortRuns)

      $scope.secondaryRunsTop = []
      for (var i in secondaryTeamRuns) {
        var teamRun = secondaryTeamRuns[i]
        $scope.secondaryRunsTop.push({
          team : {name: teamRun.team.name},
          score: teamRun.sumScore,
          time : teamRun.sumTime,
          rescuedVictims : teamRun.sumRescue,
          LoPsNum : teamRun.sumLoPs
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
      return {
          score: runs[0].score,
          time : runs[0].time,
          rescued : runs[0].rescuedVictims,
          lops : runs[0].LoPsNum
      }
    }

    runs.sort(sortRuns)

    return {
      score: runs[0].score + runs[1].score,
      time : {
        minutes: runs[0].time.minutes + runs[1].time.minutes +
                 (runs[0].time.seconds + runs[1].time.seconds >= 60 ? 1 : 0),
        seconds: (runs[0].time.seconds + runs[1].time.seconds) % 60
      },
      rescued : runs[0].rescuedVictims + runs[1].rescuedVictims,
      lops : runs[0].LoPsNum + runs[1].LoPsNum
    }
  }
    

    function BestScore(runs) {
    if (runs.length == 1) {
      return runs[0]
    }

    runs.sort(sortRuns)
    if(runs[0].score > runs[1].score){
        return runs[0]
    }
    else if(runs[0].score < runs[1].score){
        return runs[1]
    }
    else{
        if(runs[0].time.minutes > runs[1].time.minutes){
             return runs[1]
        }
        else if(runs[0].time.minutes == runs[1].time.minutes){
            if(runs[0].time.seconds > runs[1].time.seconds){
                return runs[1]
            }
            else{
                return runs[0]
            }
        }
        else{
            return runs[0]
        }
    }
    

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
        /*}else{
            return 0
        }*/
        } else if (a.rescuedVictims > b.rescuedVictims){
              return -1
          }
          else if (a.rescuedVictims < b.rescuedVictims){
              return 1
          }
          else if (a.LoPsNum < b.LoPsNum){
              return -1
          }
          else if (a.LoPsNum > b.LoPsNum){
              return 1
          }
          else {
              return 0
        }
      }
    } else {
      return b.score - a.score
    }
  }
})