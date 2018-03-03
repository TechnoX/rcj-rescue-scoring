var app = angular.module("CompetitionHome", ['pascalprecht.translate', 'ngCookies']);
app.controller("CompetitionHomeController", ['$scope', '$http', '$translate', function ($scope, $http, $translate) {
    
    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })

    
    


    $scope.go = function (path) {
        window.location = path
    }

}]);
