var app = angular.module("AdminHome", ['ngTouch','pascalprecht.translate', 'ngCookies']).controller("AdminHomeController", function ($scope, $http) {
    $scope.competitionId = competitionId

    updateCompetitionList()

    $http.get("/api/competitions/rules").then(function (response) {
        $scope.rules = response.data
        $scope.competitonUseRule = $scope.rules[$scope.rules.length-1];
    })

    $scope.go = function (path) {
        window.location = path
    }

    $scope.addCompetition = function () {
        var competition = {
            name: $scope.competitionName,
            rule: $scope.competitonUseRule
        }

        $http.post("/api/competitions", competition).then(function (response) {
            console.log(response)
            updateCompetitionList()
        }, function (error) {
            console.log(error)
        })
    }

    $scope.removeCompetition = async function (competition) {
        const {
            value: operation
        } = await swal({
            title: "Remove competition?",
            text: "Are you sure you want to remove the competition: " +
              competition.name + '?',
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            confirmButtonColor: "#ec6c62",
            input: 'text',
            inputPlaceholder: 'Enter "DELETE" here',
            inputValidator: (value) => {
                return value != 'DELETE' && 'You need to type "DELETE" !'
            }
        })

        if (operation) {
            $http.delete("/api/competitions/" +
              competition._id).then(function (response) {
                console.log(response)
                updateCompetitionList()
            }, function (error) {
                console.log(error)
            })
        }
    }

    function updateCompetitionList() {
        $http.get("/api/competitions/").then(function (response) {
            $scope.competitions = response.data
            console.log($scope.competitions)
        })
    }
})
