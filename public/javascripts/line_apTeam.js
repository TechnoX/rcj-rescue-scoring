var app = angular.module("LineTimetable", ['ngTouch','pascalprecht.translate', 'ngCookies']);
app.controller("LineTimetableController", ['$scope', '$http', '$translate','$window', function ($scope, $http, $translate,$window) {
    var parentScope = $window.parent.angular.element($window.frameElement).scope();
    $scope.competitionId = competitionId
    $scope.teamId = teamId
    $scope.selected = null;
    $scope.checked = false;


    $scope.checkTeam = $scope.checkMember = $scope.checkMachine = false;
    $scope.toggleCheckTeam = function () {
        $scope.checkTeam = !$scope.checkTeam;
        playSound(sClick);
    }
    $scope.toggleCheckMember = function () {
        $scope.checkMember = !$scope.checkMember;
        playSound(sClick);
    }
    $scope.toggleCheckMachine = function () {
        $scope.checkMachine = !$scope.checkMachine;
        playSound(sClick);
    }
    $scope.checks = function () {
        return ($scope.checkTeam & $scope.checkMember & $scope.checkMachine)
    }


    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
        $http.get("/api/teams/" + teamId).then(function (response) {
            $scope.team = response.data
            $scope.update_list()
        })
    })




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

    $scope.update_list = function () {
        $http.get("/api/competitions/" + competitionId +
            "/line/runs?timetable=true&populate=true").then(function (response) {
            var runs = response.data
            $scope.runs = runs
            console.log($scope.runs)

            $scope.table = []
            $scope.fields = []
            $scope.rounds = []
            for (let run of $scope.runs) {
                console.log(run);
                //console.log(run.field.league);
                //console.log($scope.team.league);
                if (run.field.league == $scope.team.league) {
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
                    if(run.group) $scope.table[round_i].count++;
                    if(run.team && run.team._id == teamId){
                        $scope.table[round_i]['able'] = false;
                    }
                    //$scope.table[run.round.name][run.startTime][run.field.name] = run;
                }
            }

            //console.log($scope.table);
            //ObjArraySort($scope.table,'startTime','asc')

            //console.log($scope.table);
            //console.log($scope.fields);

            //$scope.$apply();
            //console.log($scope.teams)
        })
    }




    function ObjArraySort(ary, key, order) {
        var reverse = 1;
        if (order && order.toLowerCase() == "desc")
            reverse = -1;
        ary.sort(function (a, b) {
            if (a[key] < b[key])
                return -1 * reverse;
            else if (a[key] == b[key])
                return 0;
            else
                return 1 * reverse;
        });
    }


    $scope.go = function (path) {
        window.location = path
    }

    $scope.infochecked = function () {
        playSound(sClick);
        $scope.checked = true;
        scrollTo(0, 0);
    }

    $scope.select = function (group) {
        playSound(sClick);
        $scope.selected = group;
    }

    function fieldById(id) {
        for (var field of $scope.fields) {
            if (field._id == id) return field.name;
        }
    }

    function unixTime2ymd(intTime) {
        var d = new Date(intTime);

        var hour = ('0' + d.getHours()).slice(-2);
        var min = ('0' + d.getMinutes()).slice(-2);

        return (hour + ':' + min);

    }

    $scope.reset = function() {
        parentScope.reset();
        parentScope.$apply();
    }

    $scope.decision = function () {
        playSound(sClick);
        if ($scope.selected) {
            $http.get("/api/runs/line/apteam/" + competitionId + "/" + teamId + "/" + $scope.selected).then(function (response) {
                playSound(sInfo);
                console.log(response.data);
                var mes = "<h5>"
                for (rep of response.data.data) {
                    mes = mes + unixTime2ymd(rep.time) + "~     フィールド： " + fieldById(rep.field) + "<br>";
                }
                mes = mes + "</h5>";
                console.log(mes);


                swal({
                    title: "競技枠の選択を完了しました",
                    html: "<h5>競技開始時間をよく覚えてください．</h5>"+ mes +"<p>競技開始 ５分前には競技フィールド周辺にてお待ちください．競技開始時刻になったら，たとえチームメンバーがやって来ていなくても計時を開始します．</p>",
                    type: "success",
                    showCancelButton: false,
                    confirmButtonText: "確認",
                    confirmButtonColor: "#ec6c62"
                }).then((result) => {
                    if (result.value) {
                        parentScope.reset();
                        parentScope.$apply();
                    }
                })
            }, function (response) {
                console.log("Error: " + response.statusText);

            });
        }
    }


}]);

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

var getAudioBuffer = function (url, fn) {
    var req = new XMLHttpRequest();
    req.responseType = 'arraybuffer';

    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            if (req.status === 0 || req.status === 200) {
                context.decodeAudioData(req.response, function (buffer) {
                    fn(buffer);
                });
            }
        }
    };

    req.open('GET', url, true);
    req.send('');
};

var playSound = function (buffer) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
};

var sClick, sInfo, sError, sTimeup;
window.onload = function () {
    getAudioBuffer('/sounds/click.mp3', function (buffer) {
        sClick = buffer;
    });
    getAudioBuffer('/sounds/info.mp3', function (buffer) {
        sInfo = buffer;
    });
    getAudioBuffer('/sounds/error.mp3', function (buffer) {
        sError = buffer;
    });
};
