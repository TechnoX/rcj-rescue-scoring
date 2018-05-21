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
  importWorkboxFrom: 'local'
};