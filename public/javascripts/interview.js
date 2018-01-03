var app = angular.module("CompetitionTeams", ['pascalprecht.translate', 'ngCookies']).controller("CompetitionTeamsController", function ($scope, $http) {
    $scope.competitionId = competitionId

    $scope.sign_empty = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3N2Zz4="
    
    updateTeamList()
    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })

    function updateTeamList() {
        $http.get("/api/competitions/" + competitionId +
            "/teams").then(function (response) {
            $scope.teams = response.data
            console.log($scope.teams)
        })
    }
    
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
    
    $scope.inspected = function(team){
        console.log(team.inspected)
        $http.put("/api/teams/" + competitionId +
            "/"+team._id , {
                inspected: !team.inspected
            }).then(function (response) {
            updateTeamList()
        })
    }
})
