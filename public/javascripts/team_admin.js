var app = angular.module("TeamAdmin", ['pascalprecht.translate', 'ngCookies']).controller("TeamAdminController", function ($scope, $http) {
    $scope.competitionId = competitionId

    updateTeamList()

    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })

    $http.get("/api/teams/leagues").then(function (response) {
        $scope.leagues = response.data
        console.log($scope.leagues)
    })

    $scope.addTeam = function () {
        var team = {
            name: $scope.teamName,
            league: $scope.teamLeague,
            competition: competitionId
        }

        $http.post("/api/teams", team).then(function (response) {
            console.log(response)
            updateTeamList()
        }, function (error) {
            console.log(error)
        })
    }
    
    $scope.selectAll = function () {
        angular.forEach($scope.teams, function (team) {
            team.checked = true;
        });
    }

    $scope.removeSelectedTeam = function () {
        var chk = [];
        angular.forEach($scope.teams, function (team) {
            if (team.checked) chk.push(team._id);
        });
        $scope.removeTeam(chk.join(","));
    }

    $scope.removeTeam = function (teamId) {
        swal({
            title: "Remove team?",
            text: "Are you sure you want to remove?",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Remove it!",
            confirmButtonColor: "#ec6c62"
        }).then((result) => {
            if (result.value) {
                $http.delete("/api/teams/" + teamId).then(function (response) {
                    console.log(response)
                    updateTeamList()
                }, function (error) {
                    console.log(error)
                })
            }
        })
    }

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
})
