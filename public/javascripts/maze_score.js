angular.module("MazeScore", ['datatables']).controller("MazeScoreController", function ($scope, $http) {
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
              "/maze/runs?populate=true").then(function (response) {
      var runs = response.data
      
      //console.log(runs)
      
      $scope.mazeRuns = []
      var mazeTeamRuns = {}
      
      for (var i in runs) {
        var run = runs[i]
        
        if (run.status >= 2 || run.score != 0 || run.time.minutes != 0 ||
            run.time.seconds != 0) {
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
      socket.emit('subscribe', 'runs/maze')
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
  
  function sumBest(runs) {
    if (runs.length == 1) {
      return runs[0]
    }
    
    runs.sort(sortRuns)
    
    let sum = {
      score: 0,
      time : {
        minutes: 0,
        seconds: 0
      }
    }
    
    for (let i = 0; i < Math.min(2, runs.length); i++) {
      sum.score += runs[i].score
      sum.time.minutes += runs[i].time.minutes
      sum.time.seconds += runs[i].time.seconds
      sum.time.minutes += Math.floor(sum.time.seconds / 60)
      sum.time.seconds %= 60
    }
    
    return sum
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
