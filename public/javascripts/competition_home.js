var app = angular.module("CompetitionHome", ['pascalprecht.translate', 'ngCookies']);
app.controller("CompetitionHomeController", ['$scope', '$http', '$translate', function ($scope, $http, $translate) {
    $scope.secretCommand = false;
    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })

    
    


    $scope.go = function (path) {
        window.location = path
    }
    
    cheet('↑ ↑ ↓ ↓ ← → ← → b a', function () {
        $scope.secretCommand = !$scope.secretCommand;
        $scope.$apply();
    });

}]);
