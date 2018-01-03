var app = angular.module("InterviewTeam", ['pascalprecht.translate', 'ngCookies', 'ngFileUpload', 'ngAlertify']).controller("InterviewTeamController",[ '$scope' , '$http', 'Upload','$timeout', 'alertify',function ($scope, $http,Upload,$timeout,alertify) {
    $scope.competitionId = competitionId
    $scope.teamId = teamId
    $scope.picN = 0;
    $scope.showImg=[];
    for(let i=0;i<50;i++){
        $scope.showImg[i]=true;
    }
    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })
    
    $http.get("/api/competitions/" + competitionId + "/teams/" + teamId).then(function (response) {
        $scope.team = response.data
        console.log($scope.team)
    })
    
    $http.get("/api/competitions/" + competitionId +
        "/line/runs?populate=true").then(function (response) {
        var runs = response.data
        for (var i in runs) {
                runs[i].LoPsNum = 0
                for (var j in runs[i].LoPs) {
                    if (runs[i].LoPs[j] == null) {
                        runs[i].LoPs[j] = 0
                    }
                    runs[i].LoPsNum += runs[i].LoPs[j]
                }
        }
        $scope.lruns = runs
    })
    $http.get("/api/competitions/" + competitionId +
        "/maze/runs?populate=true").then(function (response) {
        var runs = response.data
        $scope.mruns = runs
    })
    
    $http.get("/api/teams/document/" + competitionId +
        "/" + teamId).then(function (response) {
        if(response.status == '200'){
            $scope.doc = response.data
            console.log($scope.doc.hardware)
        }else{
            $scope.doc = null
        }
    })
    
    function getPicN(){
        $http.get("/api/teams/pic/" + competitionId +
            "/" + teamId).then(function (response) {
            if(response.status == '200'){
                $scope.picN = response.data.number
            }else{
                $scope.picN = 0
            }
        })
    }
    getPicN();


    $scope.go = function (path) {
        window.location = path
    }
    
    $scope.getParam = function (key) {
        var str = location.search.split("?");
        if (str.length < 2) {
          return "";
        }

        var params = str[1].split("&");
        for (var i = 0; i < params.length; i++) {
          var keyVal = params[i].split("=");
          if (keyVal[0] == key && keyVal.length == 2) {
            return decodeURIComponent(keyVal[1]);
          }
        }
        return "";
    }
    
    $scope.range = function(n) {
        var arr = [];
        for (var i=0; i<n; ++i) arr.push(i);

        return arr;
    }
    
    $scope.showI = function(i){
        $scope.showImg[i] = true;
    }
    

    $scope.send = function(){
        
        //console.log($scope.team.comment);
        //console.log($scope.doc);
        delete $scope.doc.member
        delete $scope.doc.role
        delete $scope.doc.roleC
        $http.post("/api/teams/document/pub/" + competitionId + "/"+teamId , $scope.doc).then(function (response) {
            $http.put("/api/teams/" + competitionId + "/"+teamId , {
                comment: $scope.team.comment,
                docPublic: $scope.team.docPublic
            }).then(function (response) {
                $scope.go('/interview/' + competitionId);
            })
        })
        
    }
}])
