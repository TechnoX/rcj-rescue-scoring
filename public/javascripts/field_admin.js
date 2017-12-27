var app = angular.module("FieldAdmin", ['pascalprecht.translate', 'ngCookies']).controller("FieldAdminController", function ($scope, $http) {
    $scope.competitionId = competitionId

    updateFieldList()

    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })

    $http.get("/api/teams/leagues").then(function (response) {
        $scope.leagues = response.data
        console.log($scope.leagues)
    })

    $scope.addField = function () {
        var field = {
            name: $scope.fieldName,
            competition: competitionId,
            league: $scope.fieldLeague
        }

        $http.post("/api/fields", field).then(function (response) {
            console.log(response)
            updateFieldList()
        }, function (error) {
            console.log(error)
        })
    }

    $scope.removeField = function (field) {
        swal({
            title: "Remove field?",
            text: "Are you sure you want to remove the field: " +
                field.name + '?',
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Remove it!",
            confirmButtonColor: "#ec6c62"
        }).then((result) => {
            if (result.value) {
            $http.delete("/api/fields/" + field._id).then(function (response) {
                console.log(response)
                updateFieldList()
            }, function (error) {
                console.log(error)
            })
            }
        })
    }

    function updateFieldList() {
        $http.get("/api/competitions/" + competitionId +
            "/fields").then(function (response) {
            $scope.fields = response.data
            console.log($scope.fields)
        })
    }
})
