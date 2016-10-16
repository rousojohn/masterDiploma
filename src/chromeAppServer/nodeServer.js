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
var shell = require('shelljs');
var lazypipe = require('lazypipe');

var userId = random().uuid4();


var configuration = {
	port : 8081,
	hostname : 'localhost', //'83.212.116.165',
	blakclist_url : 'http://pgl.yoyo.org/as/serverlist.php?hostformat=;showintro=0',
	blacklist_file : './webNinja_blackList',
	jsUnpackDir : '~/jsunpack-n/'
};

app.use(compression());
app.use(helmet());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use(function(req, res, next) {
	next();
});

app.post('/', function (req, res, next) {	
	logMe('app.post callback', '');

	var _userUrl = req.body.url;

	fileAccess(configuration.blacklist_file)
		.then(blacklist_exists, blacklist_notExists)
		.then(function(regex) {
			
			logMe('app.post', 'before getClientsPage');
			return getClientsPage(regex, _userUrl);

		}, function(){})
		.then(function(html) {
			logMe('app.post', 'before writeToFile');

			return writeToFile(shell.tempdir() + "/" + userId + ".html", html)
					.then(execJsUnpack)
					.then(replaceTextToFile)
					.then(createResObject);
		})
		.then(function(html) {
			logMe('app.post', 'before response');

			res.json(html);
			shell.rm("-rf", shell.tempdir() + "/" + userId + ".tmp.txt");
			shell.rm("-rf", shell.tempdir() + "/" + userId + ".html");
			shell.rm("-rf", "~/webNinjaOutput/" + userId);
			shell.rm("-rf", path.join(__dirname, userId+".html"));
		})
		.done();
});

var server = app.listen(configuration.port, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);

});

var replaceTextToFile = function (file_needle) {
	logMe('replaceTextToFile', '');

	var deferred = Q.defer();

	var fileToread = file_needle.file;
	var needle =  file_needle.needle;
	var fileToReturn = path.join(__dirname, userId+".html");

	if (!Array.isArray(needle) && needle.trim().length === 0) {
		logMe('replaceTextToFile', 'needle is empty');

		deferred.resolve(fileToread);
	}
	else {
		var _replaces = lazypipe();

		var writeStream = fs.createWriteStream(fileToReturn);
		
		writeStream.on('finish', function () {
			deferred.resolve(fileToReturn);
		});
	
		writeStream.on('error', function(err){
			logMe('replaceTextToFile', 'writeStream.onError');
			logMe('replaceTextToFile', err);


			deferred.reject();
		});

		logMe('replaceTextToFile', 'Writing File');
	
		needle.forEach(function(element, index, array){
			_replaces.pipe(replacestream(element, ''));
		});
		
		fs.createReadStream(fileToread)
		  .pipe(_replaces)
		  .pipe(writeStream);
	}

  return deferred.promise;
};

var execJsUnpack = function (_file) {
	logMe('execJsUnpack', '');

	var deferred = Q.defer();
	
	var tmpFile = shell.tempdir() + "/" + userId + ".tmp.txt";
	var cur_dir = shell.pwd();
	shell.cd(configuration.jsUnpackDir);

	var cmd = 'python jsunpackn.py -d ~/webNinjaOutput/' + userId + " -a -V " + _file;
	logMe('execJsUnpack', 'cmd = '+cmd);

	shell.exec(cmd, {silent:true}, function (code, stdout, stderr) {
		logMe('execJsUnpack', 'shell.exec callback');

		var textToRemove = [];
		if ( code !== 0) {
			logMe('execJsUnpack.callback', 'error: '+stderr);

			deferred.reject(stderr);
		}
		else {
			shell.ShellString(stdout).to(tmpFile);
			shell.chmod(655, tmpFile);
			shell.cd(cur_dir);

			var isMalicious = shell.cat(tmpFile).grep('malicious').stdout.trim();
			var isSuspicious = shell.cat(tmpFile).grep('suspicious').stdout.trim();
			
			if (isMalicious.length === 0 && isSuspicious.length === 0 ) {
				logMe('execJsUnpack.callback', 'site is Clear');

				textToRemove = '';
			}
			else {
				logMe('execJsUnpack.callback', 'site is malicious|suspicious');
				var _files = shell.ls('~/webNinjaOutput/' + userId + '/original_*');
				_files.forEach(function(element, index, array){
					textToRemove.push(shell.cat(element).stdout);
				});
			}

		}
		shell.cd(cur_dir);
		deferred.resolve({file: _file, needle : textToRemove});
	});
	return deferred.promise; 
};

var createResObject = function (_file) {
	logMe('createResObject', '');

	var deferred = Q.defer();

	jsdom.env({
		file : _file,
		scripts : ["http://code.jquery.com/jquery.js"],
		done : function (err, window) {
			
			logMe('jsdom.env', 'callback');
			
			if (err) {
				logMe('createResObject.callback', 'err: '+err);
				deferred.reject(err);
			}
			
			var $ = '';
			if (window.$)
			 $ = window.$ ;
			else if ( window.jQuery )
				$ = window.jQuery;
			var _head = $("head").html();
			var _body = $("body").html();

			$('script').last().remove();
			deferred.resolve({ head : _head, body: _body});
		}
	});
	return deferred.promise;
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
					
					return '<html>' + head + body + '</html>'; //{head: head, body: body};//
				}, regex, clearElement)
				.then(function(html){
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
	var deferred = Q.defer();
	
	phantom.create().then(function(ph) {
		ph.createPage().then(function (page) {
			page.open(configuration.blakclist_url).then(function(status){
				page.evaluate(function (){
						return document.getElementsByTagName('pre')[0].innerHTML;
					})
					.then(function(html){
						html = html.trim().replace(/\s/g, "|");
						
						deferred.resolve(html);
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

var writeToFile = function (_file, _content) {
	var deferred = Q.defer();
	fs.writeFile(_file, _content, function(err, data) {
		if (err) deferred.reject();
		else deferred.resolve(_file);
	});
	return deferred.promise;
};

var writeBLKlstToFile = function (_content) {
	return writeToFile(configuration.blacklist_file, _content);
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
	return readFromFile(configuration.blacklist_file);
};

var blacklist_notExists = function (flag) {
	return	getAdsDomainList().then(writeBLKlstToFile).then(readFromFile);
};

var logMe = function (src, msg) {
	var logMsg = '['+ new Date() + ']' + ' --- Src: ' + src + ' --- Msg: ' + msg ; 
	console.log(logMsg);
};
