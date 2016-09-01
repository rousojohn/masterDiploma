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

var execFile = require('child_process').execFile;
var random = require('random-js');

var userId = random().uuid4();



/*
app.get('/', function (req, res, next) {
	fs.createReadStream(path.join(__dirname, 'happybirthday.txt'))
  .pipe(replaceStream('birthday', 'earthday'))
  .pipe(process.stdout);
  });
*/

	var configuration = {
	port : 8081,
	hostname : 'localhost', //'83.212.116.165',
	blakclist_url : 'http://pgl.yoyo.org/as/serverlist.php?hostformat=;showintro=0',
	blacklist_file : './webNinja_blackList',
	jsUnpack : '../'
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

app.post('/', function (req, res, next) {
	console.log("app.post");
	
	var _userUrl = req.body.url;
	fileAccess(configuration.blacklist_file)
		.then(blacklist_exists, blacklist_notExists)
		.then(function(regex) {
			return getClientsPage(regex, _userUrl);
		}, function(){})
		.then(function(html) {
			res.json(html);
		})
		.done();
});


var server = app.listen(configuration.port, configuration.hostname, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);

});


var execJsUnpack = function (_file) {
	var deferred = Q.defer();
	const execFile = execFile ( configuration.jsUnpack, [userId, _file]
	return deferred.promise; 
};

var createResObject = function (_file) {
	var deferred = Q.deferred();
	jsdom.env({
		file : _file,
		scripts : ["http://code.jquery.com/jquery.js"],
		done : function (err, window) {
			if (err) {
				console.log(err);
				deferred.reject(err);
			}
			var $ = window.$;
			$('script').last().remove();

			deferred.resolve({ head : $("head").html(), body: $("body").html()});
		}
	});
};

var getClientsPage = function (regex, _url) {
	var deferred = Q.defer();
	phantom.create().then(function (ph) {
		ph.createPage().then(function (page) {
			page.open(_url).then(function (status) {
				page
				.evaluate(function(regex, clearElement) {
					
					for (var i=0; i < document.scripts.length; i++ ) {
						if ((new RegExp(regex)).test(document.scripts[i].src))
							clearElement(document.scripts[i]);
					}
					
					for (var i=0; i < document.body.getElementsByTagName('iframe').length; i++) {
						if ((new RegExp(regex)).test(document.body.getElementsByTagName('iframe')[i].src))
							clearElement(document.body.getElementsByTagName('iframe')[i]);
					}
						
						
					var head = document.head.outerHTML;
					
					var body = document.body.outerHTML;
					
					return {head: head, body: body};//'<html>' + head + body + '</html>';
				}, regex, clearElement)
				.then(function(html){
					//console.log(html);
					//clientRes.json(html);
						//clientRes.send(html);
						console.log('<html>'+html.head+html.body+'</html>');
						deferred.resolve(html);
				});
				
				page.close();
				ph.exit();
			});
		});
	});
	
	return deferred.promise;
};


var getAdsDomainList = function () {
	console.log("getAdsDomainList");
	var deferred = Q.defer();
	
	phantom.create().then(function(ph) {
		ph.createPage().then(function (page) {
			page.open(configuration.blakclist_url).then(function(status){
			//console.log(_url);
				page.evaluate(function (){
						console.log(document.getElementsByTagName('pre')[0].innerHTML);
						return document.getElementsByTagName('pre')[0].innerHTML;
					})
					.then(function(html){
						//console.log("myhtml", html.trim().replace(/\s/g, "|"));
						
						// trim leading and trailing whispaces
						// replace whitespaces with '|' in order to create a regural expression to test.
												
						html = html.trim().replace(/\s/g, "|");
						
						deferred.resolve(html);
						//writeToFile(html);
						//console.log(_url);
						//getClientsPage(res, html, _url);
						
					});
			});
		});
	});
	return deferred.promise;
};

var clearElement = function (_element) {
	_element.src = '';
	_element.innerHTML = '';
	_element.outerHTML = '';
};


var writeToFile = function (_content) {
	console.log("writeToFile");
	var deferred = Q.defer();
	fs.writeFile(configuration.blacklist_file, _content, function(err, data) {
		if (err) deferred.reject();
		else deferred.resolve(configuration.blacklist_file);
	});
	return deferred.promise;
};


var readFromFile = function (file) {
	var deferred = Q.defer();
	fs.readFile(file, 'utf-8', function (err, data) {
		if (err) deferred.reject(err); // rejects the promise with `er` as the reason
		else deferred.resolve(data); // fulfills the promise with `data` as the value
  });
  return deferred.promise;
};

var fileStats = function (file) {
	var deferred = Q.defer();
	fs.stat(file, function (err, stats) {
		if (err) deferred.reject(err);
		else deferred.resolve(stats);
	});
	return deferred.promise;
};

var fileAccess = function (file) {
	var deferred = Q.defer();
	fs.access(file, function (err) {
		if (err) deferred.reject();
		else deferred.resolve();
	});
	return deferred.promise;
};

var blacklist_exists = function (flag) {
	console.log('file Exists');
	return readFromFile(configuration.blacklist_file);
};

var blacklist_notExists = function (flag) {
	console.log("blacklist_notExists");
	return	getAdsDomainList().then(writeToFile).then(readFromFile);
};