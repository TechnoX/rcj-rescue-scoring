"use strict";
const {src, symlink} = require('gulp')

const module_dir = "node_modules/"
const components_dir = "public/components"

const packages = [
  "jquery",
  "socket.io-client",
  "async",
  "alertifyjs",
  "datatables",
  "angular",
  "angular-datatables",
  "angularjs-slider",
  "sweetalert",
  "font-awesome",
  "jsignature",
  "angular-animate",
  "angular-bootstrap",
  "css-toggle-switch",
  "responsive-nav",
  "tether",
  "dateformat",
  "angularjs-bootstrap-datetimepicker",
  "bootstrap",
  "popper.js"
]


function link_frontend() {
  return src(packages.map(name => module_dir + name))
    .pipe(symlink(components_dir))
}

exports.default = link_frontend