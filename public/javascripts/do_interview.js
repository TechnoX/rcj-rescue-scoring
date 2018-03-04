var app = angular.module("InterviewTeam", ['pascalprecht.translate', 'ngCookies', 'ngFileUpload', 'ngAlertify']).controller("InterviewTeamController",[ '$scope' , '$http', 'Upload','$timeout', 'alertify',function ($scope, $http,Upload,$timeout,alertify) {
    $scope.competitionId = competitionId
    $scope.teamId = teamId
    $scope.picN = 0;
    $scope.showImg=[];
    $scope.picMeTime = "";
    $scope.picMaTime = "";
    for(let i=0;i<50;i++){
        $scope.showImg[i]=true;
    }
    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })
    
    $http.get("/api/competitions/" + competitionId + "/teams/" + teamId).then(function (response) {
        $scope.team = response.data
        
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
    
    $scope.uploadPic = function(item,i){
      Upload.upload({
          url:'/api/teams/pic/' + competitionId +'/' + teamId + '/' + i,
          data: {
            file: item
          },
      })
      .then(function (resp){
            //$scope.showImg[i]= false;
            //console.log("画像アップロード完了");
            alertify.success('画像アップロード完了！');
            getPicN();
            $scope.picFile = null
            //$timeout($scope.showI(i), 1000);
      },function (resp) {}
       ,function (evt)  {}
      );
    }
    
    
    $scope.uploadPicMe = function(item,i){
      $scope.member_photo = false;
      Upload.upload({
          url:'/api/teams/pic/' + competitionId +'/' + teamId + '/' + i,
          data: {
            file: item
          },
      })
      .then(function (resp){
            //$scope.showImg[i]= false;
            //console.log("画像アップロード完了");
            alertify.success('画像アップロード完了！');
            $scope.picFileMe = null
            var date = new Date();
            $scope.picMeTime = "?time=" + date.getTime();
      },function (resp) {}
       ,function (evt)  {}
      );
    }
    
    $scope.uploadPicMa = function(item,i){
      $scope.member_photo = false;
      Upload.upload({
          url:'/api/teams/pic/' + competitionId +'/' + teamId + '/' + i,
          data: {
            file: item
          },
      })
      .then(function (resp){
            //$scope.showImg[i]= false;
            //console.log("画像アップロード完了");
            alertify.success('画像アップロード完了！');
            $scope.picFileMa = null
            var date = new Date();
            $scope.picMaTime = "?time=" + date.getTime();
            $http.put("/api/teams/" + competitionId +
                "/"+teamId, {
                    inspected: true
                }).then(function (response) {
            })
      },function (resp) {}
       ,function (evt)  {}
      );
    }

    $scope.send = function(){
        var sign;
        var sign_empty = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4="
        var datapair = $("#int_sig").jSignature("getData", "svgbase64")
        if (datapair[1] == sign_empty) {
            sign = null;
        } else {
            sign = "data:" + datapair[0] + "," + datapair[1];
        }
        //console.log($scope.team.comment);
        //console.log($scope.doc);
        $http.put("/api/teams/document/" + competitionId + "/"+teamId , $scope.doc).then(function (response) {
            $http.put("/api/teams/" + competitionId + "/"+teamId , {
                interviewer: sign,
                comment: $scope.team.comment
            }).then(function (response) {
                $scope.go('/interview/' + competitionId);
            })
        })
        
    }
}])
