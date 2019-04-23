var socket;

var app = angular.module("TimeTable", ['ngTouch','datatables', 'ui.bootstrap', 'ngAnimate', 'pascalprecht.translate', 'ngCookies','ngSanitize']);
app.controller("TimeTableController", function ($scope, $http, $sce) {
    $scope.competitionId = competitionId
    $scope.go = function (path) {
        window.location = path
    }

    $scope.time = 15;
    var nowI = 0;


    function updateTime(){
        $scope.time--;
        if($scope.time == 0){
            nowI += 8;
            if(nowI >= $scope.table.data.length){
                window.parent.iframeEnd();
                clearInterval(inter);
                return;
            }
            $scope.showTableData = $scope.table.data.slice(nowI,nowI+8);
            console.log($scope.showTableData);
            $scope.time = 15;
        }
        $scope.$apply();
    }

    
    $scope.startSig = function(){
        inter = setInterval(updateTime, 1000);
    }


    function array_exist(arr, name) {
        for (let i in arr) {
            if (arr[i].name == name) return 1;
        }
        return 0;
    }

    function table_exist_round(arr, round) {
        for (let i in arr) {
            if (arr[i].round == round) return i;
        }
        return -1;
    }

    function table_exist_time(arr, time) {
        for (let i in arr) {
            if (arr[i].time == time) return i;
        }
        return -1;
    }
    $http.get("/api/teams/leagues/line/" + competitionId).then(function (response) {
        $scope.leagues = response.data
        console.log($scope.leagues);
    })

    $scope.getLeagueName = function(){
        for(let l of $scope.leagues){
            if(l.id == league) return l.name;
        }
    }

    $http.get("/api/competitions/" + competitionId +
      "/line/runs?timetable=true&populate=true").then(function (response) {
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

        $scope.runs = runs

        $scope.table = []
        $scope.fields = []
        $scope.rounds = []
        for (let run of $scope.runs) {
            console.log(run);
            //console.log(run.field.league);
            //console.log($scope.team.league);
            if (run.field.league == league && run.round.name == round) {
                if (!array_exist($scope.fields, run.field.name)) $scope.fields.push(run.field);
                if (!array_exist($scope.rounds, run.round.name)) $scope.rounds.push(run.round);
                var round_i = table_exist_round($scope.table, run.round.name);
                if (round_i == -1) { //Not exist round --> create
                    round_i = $scope.table.push({
                        'round': run.round.name,
                        'count': 0,
                        'data': [],
                        'able': true
                    }) - 1;
                }

                var time_i = table_exist_time($scope.table[round_i].data, run.startTime);
                if (time_i == -1) {
                    time_i = $scope.table[round_i].data.push({
                        'time': run.startTime,
                        'run': []
                    }) - 1;
                }
                //console.log($scope.table[round_i]);
                $scope.table[round_i].data[time_i].run.push(run);
                $scope.table[round_i].count++;
                //$scope.table[run.round.name][run.startTime][run.field.name] = run;
            }
        }

        $scope.table = $scope.table[0];
        console.log($scope.table);

        $scope.showTableData = $scope.table.data.slice(nowI,nowI+8);
        console.log($scope.showTableData);

    })




});