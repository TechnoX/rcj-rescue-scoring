module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "components/**/*.{js,css,scss,woff2}",
    "javascripts/*.js",
    "lang/*.json",
    "stylesheets/*.css",
    "templates/*.html",
    "sounds/*.mp3",
    "images/**/*"
  ],
  "swDest": "public/sw.js",
  importWorkboxFrom: 'local'
};