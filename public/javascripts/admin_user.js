var app = angular.module("AdminUser", ['pascalprecht.translate', 'ngCookies']).controller("AdminUserController", function ($scope, $http) {
    
    updateUserList()
    

    $scope.addUser = function () {
        var newUser = {
            username: $scope.userName,
            password: $scope.userPass,
            admin: $scope.userAuthAdmin,
            superDuperAdmin: $scope.userAuthSuper,
            competitions: []
        }
        console.log(newUser)
        $http.post("/api/users", newUser).then(function (response) {
            console.log(response)
            updateUserList()
        }, function (error) {
            console.log(error)
        })
    }

    $scope.removeUser = function (user) {
        swal({
            title: "Remove user?",
            text: "Are you sure you want to remove the user: " +
                user.username + '?',
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Remove it!",
            confirmButtonColor: "#ec6c62"
        }).then((result) => {
            if (result.value) {
            $http.delete("/api/users/" + user._id).then(function (response) {
                console.log(response)
                updateUserList()
            }, function (error) {
                console.log(error)
            })
            }
        })
    }
    
    $scope.go = function (path) {
        window.location = path
    }

    function updateUserList() {
        $http.get("/api/users").then(function (response) {
            $scope.users = response.data
        })
        $scope.userAuthAdmin= false
        $scope.userAuthSuper= false
    }
})
