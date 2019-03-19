var app = angular.module("MazeScore", ['ngTouch','datatables', 'pascalprecht.translate', 'ngCookies','ngSanitize'])
app.controller("MazeScoreController", function ($scope, $http) {
    console.log(UseRunsNumber);
    $scope.competitionId = competitionId;
    $scope.sortOrder = ['-score','time.minutes*60+time.seconds','-foundVictims','LoPs'];
    $scope.go = function (path) {
        window.location = path
    }

    var runListTimer = null;
    var runListChanged = false;
    $scope.nowR = 4;
    $scope.top3 = true;
    $scope.time = 10;
    var inter;
    launchSocketIo()
    updateRunList(function () {
        setTimeout(function () {
            window.scrollTo(0, window.scrollY +
                document.getElementById("rank").getBoundingClientRect().top -
                50);
        }, 200)
    })
    /*if (get['autoscroll'] != undefined) {
        scrollpage()
    }*/

    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })
    $http.get("/api/competitions/leagues/" + league).then(function (response) {
        $scope.league = response.data
    })
    
    function updateTime(){
        $scope.time--;
        if($scope.time == 0){
            if($scope.top3){
                $scope.top3 = !$scope.top3;
                $scope.time = 10;
            }else{
                if($scope.nowR + 5 < $scope.mazeRunsTop.length){
                    $scope.nowR += 6;
                    $scope.time = 10;
                }else{
                    window.parent.iframeEnd();
                    clearInterval(inter);
                }
            }
        }
        $scope.$apply();
    }

    $scope.startSig = function(){
        inter = setInterval(updateTime, 1000);
    }

    function updateRunList(callback) {
        $http.get("/api/competitions/" + competitionId +
            "/maze/runs?populate=true").then(function (response) {
            var runs = response.data
            
            for(let run of runs){
                try{
                    var teamname = run.team.name.split(' ');
                    run.teamCode = teamname[0];
                    run.teamName = teamname[1];
                    for(let i = 2; i < teamname.length;i++){
                        run.teamName = run.teamName + " " + teamname[i];
                    }

                }
                catch(e){

                }
            }
            //console.log(runs)

            $scope.mazeRuns = []
            var mazeTeamRuns = {}

            for (var i in runs) {
                var run = runs[i]

                if (run.status >= 2 || run.score != 0 || run.time.minutes != 0 ||
                    run.time.seconds != 0) {
                    if (run.team.league == league) {
                        $scope.mazeRuns.push(run)
                        if (mazeTeamRuns[run.team._id] === undefined) {
                            mazeTeamRuns[run.team._id] = {
                                team: {
                                    name: run.team.name,
                                    code: run.teamCode,
                                    name_only: run.teamName
                                },
                                runs: [run]
                            }
                        } else {
                            mazeTeamRuns[run.team._id].runs.push(run)
                        }
                        var sum = sumBest(mazeTeamRuns[run.team._id].runs)
                        //console.log(sum)
                        mazeTeamRuns[run.team._id].sumScore = sum.score
                        mazeTeamRuns[run.team._id].sumTime = sum.time
                        mazeTeamRuns[run.team._id].sumExit = sum.exit
                        mazeTeamRuns[run.team._id].sumLoPs = sum.lops
                        mazeTeamRuns[run.team._id].sumFound = sum.found
                    }
                }
            }
            //$scope.mazeRuns.sort(sortRuns)

            $scope.mazeRunsTop = []
            for (var i in mazeTeamRuns) {
                var teamRun = mazeTeamRuns[i]
                $scope.mazeRunsTop.push({
                    team: teamRun.team,
                    score: teamRun.sumScore,
                    time: teamRun.sumTime,
                    lops: teamRun.sumLoPs,
                    exit: teamRun.sumExit,
                    found: teamRun.sumFound
                })
            }
            $scope.mazeRunsTop.sort(sortRuns)

            if (callback != null && callback.constructor == Function) {
                callback()
            }
            var now = new Date();
            $scope.updateTime = now.toLocaleString();
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
        socket = io({
            transports: ['websocket']
        }).connect(window.location.origin)
        socket.on('connect', function () {
            socket.emit('subscribe', 'runs/maze/' + competitionId)
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
        let sum = {
            score: 0,
            time: {
                minutes: 0,
                seconds: 0
            },
            lops: 0,
            exit: 0,
            found: 0
        }

        runs.sort(sortRuns)

        for (let i = 0; i < Math.min(UseRunsNumber, runs.length); i++) {
            sum.score += runs[i].score
            sum.time.minutes += runs[i].time.minutes
            sum.time.seconds += runs[i].time.seconds
            sum.lops += runs[i].LoPs
            if(runs[i].exitBonus) sum.exit++
            sum.found += runs[i].foundVictims
        }
        sum.time.minutes += Math.floor(sum.time.seconds/60);
        sum.time.seconds %= 60;

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
                    if(a.exit > b.exit){
                        return -1;
                    }else if(a.exit < b.exit){
                        return 1;
                    }else if(a.found > b.found){
                        return -1;
                    }else if(a.found < b.found){
                        return 1;
                    }else if(a.lops > b.lops){
                        return 1;
                    }else if(a.lops < b.lops){
                        return -1;
                    }else{
                        return 0;
                    }
                }
            }
        } else {
            return b.score - a.score
        }
    }
})

// HAX
function scrollpage() {
    var i = 1,
        status = 0,
        speed = 1,
        period = 15

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
