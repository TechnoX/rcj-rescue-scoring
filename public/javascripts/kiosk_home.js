// register the directive with your app module
var app = angular.module('ddApp', ['ngTouch','ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$cookies', function ($scope, $uibModal, $log, $timeout, $http, $cookies) {
    $http.get("/api/competitions/" + cid).then(function (response) {
        $scope.competition = response.data
    })

    $http.get("/api/teams/leagues/all/" + cid).then(function (response) {
        $scope.leagues = response.data
        console.log($scope.leagues)
    })

    $scope.kioskSrc = "";

    
    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }

    $scope.reset = function(){
        playSound(sClick);
        console.log("RESET");
        $scope.teamLeague = "";
        $scope.selectTeamId = "";
        $scope.selectTeamName = "";
        $scope.code = "";
        $scope.mode = null;
        $scope.type = null;
        $scope.error = null;
        $scope.lruns = null;
        $scope.mruns = null;
        $scope.frameSrc = null;
        $scope.flag_frame = null;
    }

    $scope.setLeague = function(str){
        playSound(sClick);
        $scope.teamLeague = str;
        $http.get("/api/competitions/"+ cid +"/" + str +"/teams").then(function (response) {
            $scope.teams = response.data
            console.log($scope.teams)
        })

        for(let l of $scope.leagues){
            if(l.id == str){
                $scope.type = l.type;
                break;
            }
        }
    }

    $scope.setTeam = function(id){
        playSound(sClick);
        $scope.selectTeamId = id;
        for(let team of $scope.teams){
            if(team._id == id){
                $scope.selectTeamName = team.name;
                break;
            }
        }
        $scope.code = "";
    }

    $scope.codeAst = function(){
        return $scope.code.replace(/[0-9]/g,'*');
    }

    $scope.input = function(num){
        playSound(sClick);
        $scope.code += String(num);
        $scope.error = null;
    }

    $scope.backSpace = function(){
        playSound(sClick);
        $scope.code = $scope.code.slice(0,-1);
        $scope.error = null;
    }


    $scope.go = function (path) {
        window.open(path)
    }
    
    $scope.codeCheck = function () {
        playSound(sClick);
        $http.get("/api/teams/code/" + $scope.selectTeamId + "/" + $scope.code).then(function (response) {
            let data = response.data;
            if(data._id){
                console.log("認証成功");
                $scope.mode = "Menu";
                $scope.error = null;
            }else{
                $scope.error = "パスコードが一致しません";
                $scope.code = "";
            }
        })
    }
    
    $scope.setMode = function (mode) {
        playSound(sClick);
        $scope.mode = mode;
        if(mode == 'Score'){
            if($scope.type == 'line'){
                $http.get("/api/runs/line/find/team_status/" + cid + "/" + $scope.selectTeamId + "/6").then(function (response) {
                      $scope.lruns = response.data;
                      for(let run of $scope.lruns){
                        let count = 0;
                        for(let i in run.LoPs){
                          count += run.LoPs[i];
                        }
                        run.LoPsNum = count;
                      }
                  }
                )
            }else {
                $http.get("/api/runs/maze/find/team_status/" + cid + "/" + $scope.selectTeamId + "/6").then(function (response) {
                      $scope.mruns = response.data
                  }
                )
            }
        }else if(mode == 'Order'){
          if($scope.type == 'line'){
            $scope.frameSrc = "/kiosk/" + cid + "/line/apteam/" + $scope.selectTeamId;
          }else {
            $scope.frameSrc = "/kiosk/" + cid + "/maze/apteam/" + $scope.selectTeamId;
          }
          $scope.flag_frame = true;
        }else if(mode == 'CheckPoint'){
          if($scope.type == 'line'){
            $http.get("/api/runs/line/find/team_status/" + cid + "/" + $scope.selectTeamId + "/0").then(function (response) {
                $scope.lruns = response.data;
              }
            )
          }
        }

    }

    $scope.setCheckPoint = function (id) {
      playSound(sClick);
      $scope.frameSrc = "/kiosk/line_checkpoint/" + id;
      $scope.flag_frame = true;
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
