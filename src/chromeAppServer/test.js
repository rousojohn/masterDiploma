var replaceStream = require('replacestream');
var path = require('path');
var compression = require('compression');
var Q = require('q');
var express = require('express');
var app = express();
var fs = require("fs");
var phantom = require("phantom");
var bodyParser = require('body-parser');
var helmet = require('helmet');

var jsdom = require('jsdom');
var exec = require('child_process').exec;
var random = require('random-js');

var userId = random().uuid4();

app.get('/', function (req, res, next) {
	console.log(userId);

	var cmd = '../test.sh 234234234 /home/rousojohn/Desktop/masterDiploma/src/chromeAppServer/milworm.html';
	const child = exec ( cmd, 
							function (error, stdout, stderr) {
								if (error) {

								    throw error;
								  }
								console.log(stdout);
								console.log(stderr);
								res.end();
							});
 });


var configuration = {
	port : 8081,
	hostname : 'localhost', //'83.212.116.165',
	blakclist_url : 'http://pgl.yoyo.org/as/serverlist.php?hostformat=;showintro=0',
	blacklist_file : './webNinja_blackList'
};


app.use(compression());
app.use(helmet());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(function(req, res, next) {
	console.log("1st middleware");
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use(function(req, res, next) {
	console.log('2nd middleware');
	next();
});


var server = app.listen(configuration.port, configuration.hostname, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);

});

