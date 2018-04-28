var socket;

angular.module("LineScore", ['datatables', 'ui.bootstrap', 'ngAnimate']).controller("LineScoreController", function ($scope, $http, $sce) {
  $scope.competitionId = competitionId
  $scope.sortOrder = '-score'
  $scope.go = function (path) {
    window.location = path
  }
  
  var runListTimer = null;
  var runListChanged = false;
  launchSocketIo()
  updateRunList(function () {
    setTimeout(function () {
      window.scrollTo(0, window.scrollY +
                         document.getElementById("rank").getBoundingClientRect().top -
                         50);
    }, 200)
  })
  if (get['autoscroll'] != undefined) {
    scrollpage()
  }
  
  $http.get("/api/competitions/" + competitionId).then(function (response) {
    $scope.competition = response.data
  })
  
  function updateRunList(callback) {
    $http.get("/api/competitions/" + competitionId +
              "/line/runs?populate=true").then(function (response) {
      var runs = response.data
      
      //console.log(runs)
      
      $scope.primaryRuns = []
      var primaryTeamRuns = {}
      $scope.secondaryRuns = []
      var secondaryTeamRuns = {}
      
      for (var i in runs) {
        var run = runs[i]
        run.LoPsNum = 0
        for (var j in run.LoPs) {
          if (run.LoPs[j] == null) {
            run.LoPs[j] = 0
          }
          run.LoPsNum += run.LoPs[j]
        }
        
        run.score = parseInt(run.score)
        
        if (run.status >= 2 || run.score != 0 || run.time.minutes != 0 ||
            run.time.seconds != 0) {
          if (true || run.team.league == "Line") {
            
            
            if (primaryTeamRuns[run.team._id] === undefined) {
              primaryTeamRuns[run.team._id] = {
                team: {
                  name: run.team.name
                },
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
            primaryTeamRuns[run.team._id].retired = sum.retired
            if (run.status == 2 || run.status == 3) {
              //primaryTeamRuns[run.team._id].isplaying = true
              //run.isplaying = true
            }
            $scope.primaryRuns.push(run)
            
          } else if (run.team.league == "Secondary") {
            $scope.secondaryRuns.push(run)
            if (secondaryTeamRuns[run.team._id] === undefined) {
              secondaryTeamRuns[run.team._id] = {
                team: {
                  name: run.team.name
                },
                runs: [run]
              }
            } else {
              secondaryTeamRuns[run.team._id].runs.push(run)
            }
            var sum = sum_jpop(secondaryTeamRuns[run.team._id].runs)
            secondaryTeamRuns[run.team._id].sumScore = sum.score
            secondaryTeamRuns[run.team._id].sumTime = sum.time
            secondaryTeamRuns[run.team._id].sumRescue = sum.rescued
            secondaryTeamRuns[run.team._id].sumLoPs = sum.lops
            secondaryTeamRuns[run.team._id].retired = sum.retired
          }
        }
      }
      //$scope.primaryRuns.sort(sortRuns)
      //$scope.secondaryRuns.sort(sortRuns)
      
      $scope.primaryRunsTop = []
      for (var i in primaryTeamRuns) {
        var teamRun = primaryTeamRuns[i]
        $scope.primaryRunsTop.push({
          team          : {
            name: teamRun.team.name
          },
          score         : teamRun.sumScore,
          time          : teamRun.sumTime,
          rescuedVictims: teamRun.sumRescue,
          LoPsNum       : teamRun.sumLoPs,
          retired       : teamRun.retired,
          isplaying     : teamRun.isplaying
        })
      }
      $scope.primaryRunsTop.sort(sortRuns)
      
      $scope.secondaryRunsTop = []
      for (var i in secondaryTeamRuns) {
        var teamRun = secondaryTeamRuns[i]
        $scope.secondaryRunsTop.push({
          team          : {
            name: teamRun.team.name
          },
          score         : teamRun.sumScore,
          time          : teamRun.sumTime,
          rescuedVictims: teamRun.sumRescue,
          LoPsNum       : teamRun.sumLoPs,
          retired       : teamRun.retired
        })
      }
      $scope.secondaryRunsTop.sort(sortRuns)
      
      if (callback != null && callback.constructor == Function) {
        callback()
      }
    })
  }


  function timerUpdateRunList() {
    if (runListChanged) {
      updateRunList();
      runListChanged = false;
      runListTimer = setTimeout(timerUpdateRunList, 1000 * 15);
    } else {
      runListTimer = null
    }
  }
  function launchSocketIo() {
    // launch socket.io
    socket = io({transports: ['websocket']}).connect(window.location.origin)
    socket.on('connect', function () {
      socket.emit('subscribe', 'runs/line')
    })
    socket.on('changed', function () {
      runListChanged = true;
      if (runListTimer == null) {
        updateRunList();
        runListChanged = false;
        runListTimer = setTimeout(timerUpdateRunList, 1000 * 15)
      }
    })
  }
  
  function sum_jpop(runs) {
    if (runs.length == 1) {
      return {
        score  : runs[0].score,
        time   : runs[0].time,
        rescued: runs[0].rescuedLiveVictims + runs[0].rescuedDeadVictims,
        lops   : runs[0].LoPsNum,
        retired: runs[0].retired
      }
    }
    var select = [];
    var not_select = [];
    var result = [];
    result.time = {};
    for (var i = 0; i < runs.length; i++) {
      if (runs[i].round.name == "1" || runs[i].round.name == "2") {
        select.push(runs[i]);
      } else {
        not_select.push(runs[i]);
      }
      if (select.length >= 2) select.sort(sortRuns);
    }
    result.score = 0;
    result.time.minutes = 0;
    result.time.seconds = 0;
    result.rescued = 0;
    result.lops = 0;
    result.retired = false;
    for (var i = 0; i < not_select.length; i++) {
      result.score += not_select[i].score;
      result.time.minutes += not_select[i].time.minutes;
      result.time.seconds += not_select[i].time.seconds;
      result.time.minutes += (result.time.seconds >= 60 ? 1 : 0);
      result.time.seconds %= 60;
      result.rescued += not_select[i].rescuedLiveVictims +
                        not_select[i].rescuedDeadVictims;
      result.lops += not_select[i].LoPsNum;
      if (not_select[i].retired) result.retired = true;
    }
    result.score += select[0].score;
    result.time.minutes += select[0].time.minutes;
    result.time.seconds += select[0].time.seconds;
    result.time.minutes += (result.time.seconds >= 60 ? 1 : 0);
    result.time.seconds %= 60;
    result.rescued += select[0].rescuedLiveVictims +
                      select[0].rescuedDeadVictims;
    result.lops += select[0].LoPsNum;
    if (select[0].retired) result.retired = true;
    return result;
  }
  
  function sumBest(runs) {
    //console.log(runs);
    if (runs.length == 1) {
      return {
        score  : runs[0].score,
        time   : runs[0].time,
        rescued: runs[0].rescuedLiveVictims + runs[0].rescuedDeadVictims,
        lops   : runs[0].LoPsNum
      }
    }
    
    runs.sort(sortRuns)
    
    let sum = {
      score  : 0,
      time   : {
        minutes: 0,
        seconds: 0
      },
      rescued: 0,
      lops   : 0
    }
    
    for (let i = 0; i < Math.min(2, runs.length); i++) {
      sum.score += runs[i].score
      sum.time.minutes += runs[i].time.minutes
      sum.time.seconds += runs[i].time.seconds
      sum.time.minutes += Math.floor(sum.time.seconds / 60)
      sum.time.seconds %= 60
      sum.rescued += runs[i].rescuedLiveVictims + runs[i].rescuedDeadVictims
      sum.lops += runs[i].LoPsNum
    }
    
    return sum
  }
  
  
  function BestScore(runs) {
    if (runs.length == 1) {
      return runs[0]
    }
    
    runs.sort(sortRuns)
    if (runs[0].score > runs[1].score) {
      return runs[0]
    } else if (runs[0].score < runs[1].score) {
      return runs[1]
    } else {
      if (runs[0].time.minutes > runs[1].time.minutes) {
        return runs[1]
      } else if (runs[0].time.minutes == runs[1].time.minutes) {
        if (runs[0].time.seconds > runs[1].time.seconds) {
          return runs[1]
        } else {
          return runs[0]
        }
      } else {
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
    //console.log(a);
    //console.log(b);
    if (a.score == b.score) {
      if (a.retired && !b.retired) return 1
      else if (!a.retired && b.retired) return -1
      else if (a.retired && b.retired) {
      } else if (a.time.minutes < b.time.minutes) {
        return -1
      } else if (a.time.minutes > b.time.minutes) {
        return 1
      } else if (a.time.seconds < b.time.seconds) {
        return -1
      } else if (a.time.seconds > b.time.seconds) {
        return 1
      }
      if (a.rescuedVictims > b.rescuedVictims) {
        return -1
      } else if (a.rescuedVictims < b.rescuedVictims) {
        return 1
      }
      if (a.LoPsNum < b.LoPsNum) {
        return -1
      } else if (a.LoPsNum > b.LoPsNum) {
        return 1
      } else {
        return 0
      }
    } else {
      return b.score - a.score
    }
  }
  
  $scope.detail = function (row) {
    //console.log(row);
  }
})

// HAX
function scrollpage() {
  var i = 1, status = 0, speed = 1, period = 15
  
  function f() {
    window.scrollTo(0, window.scrollY +
                       document.getElementById("allRuns").getBoundingClientRect().top -
                       50 + i);
    if (status == 0) {
      i = i + speed;
      if (document.getElementById("allRuns").getBoundingClientRect().bottom <
          Math.max(document.documentElement.clientHeight, window.innerHeight ||
                                                          0)) {
        status = 1;
        return setTimeout(f, 1000);
      }
    } else {
      i = i - speed;
      if (document.getElementById("allRuns").getBoundingClientRect().top > 50) {
        status = 0;
        return setTimeout(f, 1000);
      }
    }
    setTimeout(f, period);
  }
  
  f();
}

$(window).on('beforeunload', function () {
  socket.emit('unsubscribe', 'runs/line');
});
