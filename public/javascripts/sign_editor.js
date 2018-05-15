// register the directive with your app module
var app = angular.module('SignEditor', ['ngTouch','ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);

// function referenced by the drop target
app.controller('SignEditorController', ['$scope', '$uibModal', '$log', '$http', '$translate', function ($scope, $uibModal, $log, $http, $translate) {



    $scope.name = "Awesome Testbana";
    $scope.contents = [];
    $scope.news = [];

    if (sigId) {
        $http.get("/api/signage/" + sigId).then(function (response) {
            $scope.name = response.data.name;
            $scope.contents = response.data.content;
            $scope.news = [];
            for(let i in response.data.news){
                var tmp = {
                    txt: response.data.news[i]
                }
                $scope.news.push(tmp);
            }
            //$scope.$apply();

        }, function (response) {
            console.log("Error: " + response.statusText);
        });
    } else {
        
    }

    
    $scope.addContents = function (number){
        var content = {
            duration : 0,
            type : "img",
            url : "",
            group: "0",
            disable: false
        }
        $scope.contents.splice(number,0,content);
    }
    
    $scope.removeContents = function (number){
        $scope.contents.splice(number,1);
    }
    
    $scope.addNews = function (number){
        var news = {
            txt: ""
        }
        $scope.news.splice(number,0,news);
    }
    
    $scope.removeNews = function (number){
        $scope.news.splice(number,1);
    }
    
    $scope.go = function (path) {
        window.location = path
    }
    
    $scope.refresh = function (){
        $http.get("/api/signage/" + sigId + "/refresh").then(function (response) {
                alert("Refresh!!");
                console.log(response.data);
        }, function (response) {
            console.log(response);
            console.log("Error: " + response.statusText);
            alert(response.data.msg);
        });
    }

    $scope.saveAs = function () {
        if ($scope.saveasname == $scope.name) {
            alert("You must have a new name when saving as!");
            return;
        }
        var signage = {
            name: $scope.nameAs,
            content : $scope.contents,
            news : saveNews()
        };
        $http.post("/api/signage", signage).then(function (response) {
            alert("Created NEW signage!");
            console.log(response.data);
            window.location.replace("/signage/setting/editor/" + response.data.id)
        }, function (response) {
            console.log(response);
            console.log("Error: " + response.statusText);
            alert(response.data.msg);
        });
        
    }
    
    function saveNews(){
        var ret=[]
        for(let i in $scope.news){
            ret.push($scope.news[i].txt);
        }
        return ret;
    }
    
    $scope.save = function () {

        
        var signage = {
            name: $scope.name,
            content : $scope.contents,
            news : saveNews()
        };

        console.log(signage);
        if (sigId) {
            $http.put("/api/signage/" + sigId, signage).then(function (response) {
                alert("Update signage!");
                console.log(response.data);
                //window.location.replace("/admin/" + competitionId + "/line/editor/" + response.data.id)
            }, function (response) {
                console.log(response);
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });
        } else {
            $http.post("/api/signage", signage).then(function (response) {
                alert("Created NEW signage!");
                console.log(response.data);
                window.location.replace("/signage/setting/editor/" + response.data.id)
            }, function (response) {
                console.log(response);
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });
        }
    }

}]);


