var express = require('express');
var Entry = require('../models/EntriesModel.js');
var router = express.Router();

var sys = require('sys')
var exec = require('child_process').exec;


var jsunpacknScript = "./test.sh ";

var stringsToCheck = [
  { str: '[malicious:', type: 'malicious' },
  { str: '[suspicious:', type: 'suspicious' },
  { str: 'children=malicious', type: 'malicious' },
  { str: 'children=suspicious', type: 'suspicious' },
  { str: '[nothing detected', type: 'not_detected' },
  { str: '[not analyzed', type: 'not_analyzed' }
];




var InitResult = function (_malicious, _suspicious, _not_detected, _not_analyzed) {
  return {
    malicious : _malicious || 0,
    suspicious : _suspicious || 0,
    not_detected : _not_detected || 0,
    not_analyzed : _not_analyzed ||  0,
    error : {}
  };
};



var StringContains = function (haystack, needle) {
  return haystack.indexOf(needle) > -1;
};


var processResult = function (stdout, _file, _res) {
    var lines = stdout.toString().split("\n");
    var res = new Array();

    lines.forEach(function (line) {
      if (line.length > 0){
        stringsToCheck.forEach(function (obj) {
          if (StringContains(line, obj.str)) _res[obj.type]++;
        });
      }
    });
    return _res;
};

router.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

/* GET users listing. */
router.get('/', function(req, res, next) {
  // res.json(resultRating);
});


// var SaveMaliciousEntry = function () {
//   Entry.create( /* some Object */, function (err, post) {
//     if (err) return err;
//     else
//       return post;
//   });
// };





/* POST entry of single user */
router.post('/', function (req, res, next) {
  var _userUrl = req.body.url;
  var _userId = req.body.userID;

  var resultRating = InitResult();


  var cmd = jsunpacknScript + _userId + " " + _userUrl;

  console.log(cmd);

  var child = exec( cmd, function (error, stdout, stderr) {
    if (error !== null) {
      console.log("ERROR: " + error);
      resultRating.error = error;
    }
    else {
      resultRating = processResult(stdout, _userId, resultRating);
    }

    console.log(resultRating);
    res.json(resultRating);
  });
});

module.exports = router;