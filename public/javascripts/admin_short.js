// register the directive with your app module
var app = angular.module('AdminShort', ['ngTouch','ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);

// function referenced by the drop target
app.controller('AdminShortController', ['$scope', '$uibModal', '$log', '$http', '$translate', function ($scope, $uibModal, $log, $http, $translate) {

    getSettingList();

    $scope.name = "Awesome Testbana";
    $scope.urlHead = window.location.protocol + "//" + document.domain + "/s/"

    $scope.set = function(){
        if($scope.name && $scope.short && $scope.transfer){

            let data = {
                name: $scope.name,
                shorted: $scope.short,
                transfer: $scope.transfer
            }

            $http.post("/api/short", data).then(function (response) {
                console.log(response.data);
                getSettingList();
            }, function (response) {
                console.log("Error: " + response.statusText);
                alert(response.data.msg);
            });

        }else{
            swal("Oops!", "Please check inputs", "error");
        }


    }

    $scope.del = function(id){
        $http.delete("/api/short/" + id).then(function (response) {
            console.log(response.data);
            getSettingList();
        }, function (response) {
            console.log("Error: " + response.statusText);
            alert(response.data.msg);
        });


    }


    function getSettingList() {
        $http.get("/api/short").then(function (response) {
            $scope.list = response.data;
            console.log($scope.list);
        }, function (response) {
            console.log("Error: " + response.statusText);
            alert(response.data.msg);
        });
    }
    

    
    $scope.go = function (path) {
        window.location = path
    }




}]);


