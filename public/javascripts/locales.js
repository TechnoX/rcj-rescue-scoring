var app = angular.module("Lang", ['ngTouch','pascalprecht.translate', 'ngCookies']);

app.controller("LangController", ['$scope', '$http', '$translate', function ($scope, $http, $translate) {
    $scope.go = function (path) {
        window.location = path
    }
    $scope.changeLanguage = function (langKey) {
        $translate.use(langKey);
        setTimeout(
            function () {
                location.href = document.referrer;
            }, 500);

    };

}]);
