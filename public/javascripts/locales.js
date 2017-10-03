var app = angular.module("Lang", ['pascalprecht.translate', 'ngCookies']);

app.controller("LangController", ['$scope', '$http', '$translate', function ($scope, $http, $translate) {
    $scope.changeLanguage = function (langKey) {
        $translate.use(langKey);
        setTimeout(
            function () {
                location.href = document.referrer;
            }, 100);

    };

}]);
