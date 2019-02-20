module.exports = {
    "globDirectory": "public/",
    "globPatterns": [
    "javascripts/*.js",
    "lang/*.json",
    "stylesheets/*.css",
    "templates/*.html",
    "sounds/*.mp3",
    "images/**/*"
  ],
    "swDest": "public/sw.js",
    importWorkboxFrom: 'local',

    // Define runtime caching rules.
    runtimeCaching: [
        {
            // Match any request ends with .png, .jpg, .jpeg or .svg.
            urlPattern: /\.(?:js|css|scss|woff2)$/,

            // Apply a cache-first strategy.
            handler: 'cacheFirst',
    },
  ],
};
