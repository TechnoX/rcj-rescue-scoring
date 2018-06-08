app.config(['$translateProvider', function ($translateProvider) {
    $translateProvider
        .useStaticFilesLoader({
            prefix: '/lang/',
            suffix: '.json'
        })

        .registerAvailableLanguageKeys(['en', 'ja'], {
            'en_*': 'en',
            'ja_*': 'ja',
            '*': 'en'
        })
        .determinePreferredLanguage()
        .useSanitizeValueStrategy('escape')
        .useMissingTranslationHandlerLog()
        .useLocalStorage();

}]);
