var app = angular.module('ddApp', ['ngTouch','ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var scp;
var allFieldOpen = 0;

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$cookies', function ($scope, $uibModal, $log, $timeout, $http, $cookies) {

    $scope.sigGroup = '0';
    $scope.signageSrc = function(){
        return "/signage/" + sigId + "/" + $scope.sigGroup;
    }
    $scope.selectfield = [];
    if(sigId){
        $scope.flagSignage = true;
    }else{
        $scope.flagSignage = false;
    }
    
    $scope.vet = 1;
    
    
    $http.get("/api/competitions/" + competitionId +
        "/Line/fields").then(function (response) {
        $scope.fields = response.data
        $http.get("/api/competitions/" + competitionId +
            "/Maze/fields").then(function (response) {
            $scope.fields = $scope.fields.concat(response.data)
            console.log($scope.fields);
        })
    })

    $scope.getIframeSrc = function (field) {
        if (field.league === "Maze") return '/maze/view/field/' + competitionId + '/' + field._id;
        return '/line/view/field/' + competitionId + '/' + field._id;
    };
    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }





    $scope.go = function (path) {
        window.open(path)
    }


    function getFieldOpen(field, level = 2) {
        if (field.league === "Maze") {
            var league = "maze";
        } else {
            var league = "line";
        }
        $http.get("/api/runs/" + league + "/find/" + competitionId + "/" +
            field._id + "/" + level).then(function (response) {
            if (response.data.length != 1) {
                if (level == 2) {
                    getFieldOpen(field, 3);
                } else {
                    allFieldOpen *= 1;
                }
            } else {
                allFieldOpen *= 0;
            }
        })
    }

    function check_selected_field() {
        for (let i = 0; i < $scope.num; i++) {
            if (!$scope.selectfield[i]) return;
            allFieldOpen = 1;
            getFieldOpen($scope.selectfield[i]);
        }
        setTimeout(changeShowItem, 5000);
    }

    function changeShowItem() {
        if (allFieldOpen) $scope.showSignage = true;
        else $scope.showSignage = false;
    }
    setInterval(check_selected_field, 10000);


}]);
