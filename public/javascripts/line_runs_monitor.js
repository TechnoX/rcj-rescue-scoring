// register the directive with your app module
var app = angular.module('ddApp', ['ngAnimate', 'ui.bootstrap', 'rzModule']);
var marker = {};
var scp;

// function referenced by the drop target
app.controller('ddController', ['$scope', '$uibModal', '$log', '$timeout', '$http', function ($scope, $uibModal, $log, $timeout, $http) {

    $http.get("/api/competitions/" + competitionId +
        "/LineNL/fields").then(function (response) {
        $scope.fields = response.data
    })
    $http.get("/api/competitions/" + competitionId +
        "/LineWL/fields").then(function (response) {
        $scope.fields = $scope.fields.concat(response.data)
    })
    scp = $scope;
    $scope.getIframeSrc = function (runId) {
        return '/line/view/inline/' + runId;
    };
    $scope.field_run = [
        {
            'id': -1,
            'name': 'Select Field↓',
            'status': 0
    },
        {
            'id': -1,
            'name': 'Select Field↓',
            'status': 0
    },
        {
            'id': -1,
            'name': 'Select Field↓',
            'status': 0
    }
  ];

    $scope.get_field_signing = function (num) {
        if ($scope.selectfield[num] != null) {
            $http.get("/api/runs/line/find/" + competitionId + "/" +
                $scope.selectfield[num]._id + "/3").then(function (response) {
                if ($scope.selectfield[num].name.indexOf('1') != -1) {
                    $scope.field_run[num].robot = 1;
                } else {
                    $scope.field_run[num].robot = 2;
                }
                if (response.data.length == 0) {
                    $scope.field_run[num].id = -1;
                    $scope.field_run[num].name = "No Team";
                    $scope.field_run[num].status = 0;
                } else if (response.data.length == 1) {
                    $scope.field_run[num].id = response.data[0]._id;
                    $scope.field_run[num].name = response.data[0].team.name;
                    $scope.field_run[num].status = 3;
                } else {
                    $scope.field_run[num].id = -2;
                    $scope.field_run[num].name = "ERROR";
                    $scope.field_run[num].status = 0;
                }
            })
        }
    }

    $scope.get_field = function (num) {
        if ($scope.selectfield[num] != null) {
            $http.get("/api/runs/line/find/" + competitionId + "/" +
                $scope.selectfield[num]._id + "/2").then(function (response) {
                if ($scope.selectfield[num].name.indexOf('1') != -1) {
                    $scope.field_run[num].robot = 1;
                } else {
                    $scope.field_run[num].robot = 2;
                }
                if (response.data.length == 0) $scope.get_field_signing(num);
                else if (response.data.length == 1) {
                    $scope.field_run[num].id = response.data[0]._id;
                    $scope.field_run[num].name = response.data[0].team.name;
                    $scope.field_run[num].status = 2;
                } else {
                    $scope.field_run[num].id = -2;
                    $scope.field_run[num].name = "ERROR";
                    $scope.field_run[num].status = 0;
                }
            })
        }
    }
    setInterval("scp.get_field(0)", 10000);
    setInterval("scp.get_field(1)", 10000);
    //setInterval("scp.get_field(2)", 10000);

    $scope.go = function (path) {
        window.open(path)
    }


}]);


var currentWidth = -1;

$(window).on('load resize', function () {
    if (currentWidth == window.innerWidth) {
        return;
    }
    currentWidth = window.innerWidth;
    var height = $('.navbar').height();
    $('body').css('padding-top', height + 20);


});
