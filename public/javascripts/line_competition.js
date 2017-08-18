var app = angular.module("LineCompetition", ['pascalprecht.translate', 'ngCookies']);
app.controller("LineCompetitionController", ['$scope', '$http', '$translate', function ($scope, $http, $translate) {
    $scope.competitionId = competitionId
    var val_go_judge, val_no_judge;
    $translate('line.competition.js.go_judge').then(function (val) {
        val_go_judge = val;
    }, function (translationId) {
        // = translationId;
    });
    $translate('line.competition.js.no_judge').then(function (val) {
        val_no_judge = val;
    }, function (translationId) {
        // = translationId;
    });


    function updateTime() {
        $scope.curTime = new Date().getTime()
        setTimeout(updateTime, 1000 * 60)
    }
    updateTime()
    $scope.show_ended = false

    var showAllRounds = true
    var showAllFields = true

    $http.get("/api/competitions/" + competitionId).then(function (response) {
        $scope.competition = response.data
    })

    $scope.update_list = function () {
        $http.get("/api/competitions/" + competitionId +
            "/line/runs?populate=true&minimum=true&ended=" +
            $scope.show_ended).then(function (response) {
            var runs = response.data
            $scope.runs = runs

            // TODO: This should be done with Set, needs polyfill?
            var rounds = {}
            var fields = {}
            for (var i = 0; i < runs.length; i++) {
                try {
                    var round = runs[i].round.name
                    if (!rounds.hasOwnProperty(round)) {
                        rounds[round] = false
                    }
                } catch (e) {

                }

                try {
                    var field = runs[i].field.name

                    if (!fields.hasOwnProperty(field)) {
                        fields[field] = false
                    }
                } catch (e) {

                }


            }

            $scope.rounds = rounds
            $scope.fields = fields

            //console.log($scope.teams)
        })
    }

    $scope.$watch('rounds', function (newValue, oldValue) {
        showAllRounds = true
        //console.log(newValue)
        for (let round in newValue) {
            if (newValue.hasOwnProperty(round)) {
                if (newValue[round]) {
                    showAllRounds = false
                    return
                }
            }
        }
    }, true)
    $scope.$watch('fields', function (newValue, oldValue) {
        //console.log(newValue)
        showAllFields = true
        for (let field in newValue) {
            if (newValue.hasOwnProperty(field)) {
                if (newValue[field]) {
                    showAllFields = false
                    return
                }
            }
        }
    }, true)

    $scope.update_list()

    $scope.list_filter = function (value, index, array) {
        if (!value.field) {
            return (showAllRounds || $scope.rounds[value.round.name]) && showAllFields
        }
        return (showAllRounds || $scope.rounds[value.round.name]) &&
            (showAllFields || $scope.fields[value.field.name])
    }


    $scope.go = function (path) {
        window.location = path
    }

    $scope.go_judge = function (path, team_name) {
        swal({
            title: team_name,
            text: val_go_judge,
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
        }, function () {
            $scope.go(path);
        }, function (error) {
            console.log(error);
        });
    }

    $scope.no_judge = function () {
        swal("Oops!", val_no_judge, "error");
    }
}]);

document.write("<script type='text/javascript' src='/javascripts/translate_config.js'></script>");
