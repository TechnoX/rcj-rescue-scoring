var app = angular.module("MapAdmin", ['pascalprecht.translate', 'ngCookies']).controller("MapAdminController", function ($scope, $http) {
    $scope.competitionId = competitionId

    updateMapList()

    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })
    $scope.removeMap = function (map) {
        if (confirm("Are you sure you want to remove the map: " + map.name + '?')) {
            $http.delete("/api/maps/line/" + map._id).then(function (response) {
                console.log(response)
                updateMapList()
            }, function (error) {
                console.log(error)
            })
        }
    }

    function updateMapList() {
        $http.get("/api/competitions/" + competitionId +
            "/line/maps").then(function (response) {
            console.log(response)
            $scope.maps = response.data
        })
    }
})
