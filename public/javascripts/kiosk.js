// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'pascalprecht.translate', 'ngCookies']);
var scp;
var allFieldOpen = 0;

console.log(kioskNumber);

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', '$cookies', function ($scope, $uibModal, $log, $timeout, $http, $cookies) {

    $scope.kioskSrc = "";
    
   
    (function launchSocketIo() {
    // launch socket.io
    socket = io(window.location.origin, {
        transports: ['websocket']
    });
    if (typeof kioskNumber !== 'undefined') {
        socket.emit('subscribe', 'kiosk/' + kioskNumber);

        socket.on('url', function (url) {
            console.log(url);      
            $scope.kioskSrc = url;
        });
        socket.on('show', function (show) {
            console.log(show);
            $scope.flag_kiosk = show;
            if(!show) $scope.kioskSrc = "";
            $scope.$apply();
        });
        socket.on('disconnect', function() {
           socket.emit('subscribe', 'kiosk/' + kioskNumber);
        })
    }


})();

    
    $scope.range = function (n) {
        arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return arr;
    }





    $scope.go = function (path) {
        socket.emit('unsubscribe', 'kiosk/' + kioskNumber);
        window.open(path)
    }
    
   



}]);

 $(window).on('beforeunload', function () {
    socket.emit('unsubscribe', 'kiosk/' + kioskNumber);
});
