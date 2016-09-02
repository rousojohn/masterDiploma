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
var exec1 = require('child_process').exec;
var random = require('random-js');

var shell = require('shelljs');


/*

cd ~/jsunpack-n/  2>&1 /dev/null
./jsunpackn.py -d ~/webNinjaOutput/$1 -a -V $2 > /tmp/$1.tmp.txt
chmod 655 /tmp/$1.tmp.txt
cd /home/$USER/Desktop/masterDiploma/src 2>&1 /dev/null

cat /tmp/$1.tmp.txt | grep 'malicious'
cat /tmp/$1.tmp.txt | grep 'suspicious'
cat /tmp/$1.tmp.txt | grep 'nothing detected'

*/

var userId = random().uuid4();
var _file = '/home/rousojohn/Desktop/masterDiploma/src/chromeAppServer/milworm.html';
var tmpFile = shell.tempdir() + "/" + userId + ".tmp.txt";

var cur_dir = shell.pwd();

shell.cd('~/jsunpack-n/');

var cmd = 'python jsunpackn.py -d ~/webNinjaOutput/' + userId + " -a -V " + _file;
shell.exec(cmd, {silent:true}, function (code, stdout, stderr) {
	if ( code !== 0) {
		console.error(stderr);
	}
	else {
		shell.ShellString(stdout).to(tmpFile);
		shell.chmod(655, tmpFile);
		shell.cd(cur_dir);

		var isMalicious = shell.cat(tmpFile).grep('malicious').stdout;
		var isSuspicious = shell.cat(tmpFile).grep('suspicious').stdout;

		if (isMalicious === isSuspicious === '') {
			console.log('is Safe');
		}
		else {
			console.log('is Dangerous');
			var textToRemove = shell.cat('~/webNinjaOutput/' + userId + '/original_*').stdout;
		}
	}


	shell.cd(cur_dir);
});