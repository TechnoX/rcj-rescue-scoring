var app = angular.module("AdminAuth", ['pascalprecht.translate', 'ngCookies']).controller("AdminAuthController", function ($scope, $http) {
    $scope.competitionId = competitionId
    updateUserList()
    $http.get("/api/competitions/" + competitionId).then(function (response) {
            $scope.competition = response.data
        })

    
    $scope.updateAuthority = function (userid , acLevel){
        $http.put("/api/users/"+userid+"/"+competitionId+"/"+acLevel).then(function (response) {
            console.log(response)
            updateUserList()
        }, function (error) {
            console.log(error)
        })
        
    }
    
    $scope.go = function (path) {
        window.location = path
    }


    function updateUserList() {
        $http.get("/api/users").then(function (response) {
            $scope.users = response.data
            
            for (let i = 0; i < $scope.users.length; i++) {
            $scope.users[i].nowAuth = -1
            for (let j = 0; j < $scope.users[i].competitions.length; j++) {
                if( $scope.competitionId == $scope.users[i].competitions[j].id){
                    $scope.users[i].nowAuth = $scope.users[i].competitions[j].accessLevel
                    break;
                }
            }
        }
        })
        
    }
})
