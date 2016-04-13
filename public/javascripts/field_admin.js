angular.module("FieldAdmin", []).controller("FieldAdminController", function ($scope, $http) {
  $scope.competitionId = competitionId

  updateFieldList()

  $http.get("/api/competitions/" + competitionId).then(function (response)  {
    $scope.competition = response.data
  })

  $scope.addField = function () {
    var field = {name: $scope.fieldName, competition: competitionId}

    $http.post("/api/fields/createfield", field).then(function (response) {
      console.log(response)
      updateFieldList()
    }, function (error) {
      console.log(error)
    })
  }

  $scope.removeField = function (id) {
    $http.get("/api/fields/" + id + "/delete").then(function (response) {
      console.log(response)
      updateFieldList()
    }, function (error) {
      console.log(error)
    })
  }

  function updateFieldList() {
    $http.get("/api/competitions/" + competitionId + "/fields").then(function (response) {
      $scope.fields = response.data
      console.log($scope.fields)
    })
  }
})