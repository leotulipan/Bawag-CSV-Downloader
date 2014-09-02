console.log("Starting node js wrapper script!");

var escapeshell = function(cmd) {
  return '"'+cmd.replace(/(["\s'$`\\])/g,'\\$1')+'"';
};

//var fs = require('fs')

// Load .env - will be accessed in slimerjs script bawag.js
var dotenv = require('dotenv');
dotenv.load();


var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('slimerjs')
var binPath = (phantomjs.path)

var childArgs = [
  ('bawag.js'),
]

childProcess.execFile( binPath , childArgs, function(err, stdout, stderr) {
  if(err) {
    console.log("There was an error executing the slimerjs script:")
    console.log(err)
    console.log(stderr)
  }
  console.log(stdout)
  // handle results
})
