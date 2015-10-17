var express = require('express');
var Entry = require('../models/EntriesModel.js');
var router = express.Router();

var sys = require('sys')
var exec = require('child_process').exec;

var crypto = require('crypto');
var request = require('request');

var EventEmitter = require('events').EventEmitter;

var jsunpacknScript = "./test.sh ";

var stringsToCheck = [
  { str: '[malicious:', type: 'malicious' },
  { str: '[suspicious:', type: 'suspicious' },
  { str: 'children=malicious', type: 'malicious' },
  { str: 'children=suspicious', type: 'suspicious' },
  { str: '[nothing detected', type: 'not_detected' },
  { str: '[not analyzed', type: 'not_analyzed' }
];




var db_createEntry = function (_newEntry) {
  console.log('db_createEntry');
  Entry.create(_newEntry, function (err, _entry) {
    if(err) {
      console.log('db_createEntry - Error');

      myEmitter.emit("returnError", err); return;
    }

    var resultRating = InitResult(_entry.malicious, _entry.suspicious, _entry.not_detected, 0);
    myEmitter.emit("returnResult", resultRating);
  });
};


var getAll = function () {
  Entry.find(function (err, data) {
    if (err) return console.error(err);
  console.log("\n\n\n\n\n\n\n\n\n\n===============\n",data);
  });
};

var db_updateEntry = function (_newEntry) {
  console.log('db_updateEntry');

  Entry.update({
    urlHash: _newEntry.urlHash
  },
  {
    domHash : _newEntry.domHash,
    malicious : _newEntry.malicious,
    suspicious : _newEntry.suspicious,
    not_detected : _newEntry.not_detected,
    updated_at : new Date()
  },
  { multi : true },

  function (err, numberAffected, raw) {
    if (err) {
      console.log('db_updateEntry - Error');
      myEmitter.emit("returnError", err);
      return;
    }
    var resultRating = InitResult(_newEntry.malicious, _newEntry.suspicious, _newEntry.not_detected, 0);
    myEmitter.emit("returnResult", resultRating);
  });
};

var dbFunctionDictionary = {
  create : db_createEntry,
  update : db_updateEntry,
};


var generateMD5 = function (_plaintxt) {
  return crypto.createHash('md5').update(_plaintxt).digest('hex');
}


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


var checkUrlHash = function (_userUrl) {
  console.log('checkUrlHash');

  var _urlHash = generateMD5(_userUrl);
  Entry.find({urlHash : _urlHash}, function (err, data) {
    if (err) {
      console.log('checkUrlHash - Error');

      gSearchDbUrlRes = null;
      myEmitter.emit("returnError", err);
      return;
    }

    if (data.length < 1) { gSearchDbUrlRes=null; myEmitter.emit("urlHashNotFound"); return;}

    gSearchDbUrlRes = data;
    myEmitter.emit("urlHashFound");
  });
};


var checkDomHash = function (_userUrl, _userId, _foundInDB) {
  console.log('checkDomHash');

  request(_userUrl, function (error, response, body) {
    if (error) {
      console.log('checkDomHash - Error');

      myEmitter.emit("returnError", error);
      return;
    }

    var _urlHash = generateMD5(_userUrl);
    var _domHash = generateMD5(body);

    Entry.find({urlHash: _urlHash, domHash: _domHash}, function (err, data) {
      if (err) { gSearchDbDomRes=null; myEmitter.emit("returnError", err); return; }
      if (data.length < 1) { gSearchDbDomRes = null; myEmitter.emit("domHashNotFound", _foundInDB); return; }

      gSearchDbDomRes = data;
      myEmitter.emit("domHashFound", data[0]);
    });
  });
};



var checkGdomHash = function () {
  console.log('checkGdomHash');

  Entry.find({urlHash: gUrlHash, domHash: gDomHash}, function (err, data) {
      if (err) {
      console.log('checkGdomHash - Error');

        gSearchDbDomRes=null;
        myEmitter.emit("returnError", err);
        return;
      }
      if (data.length < 1) { gSearchDbDomRes = null; myEmitter.emit("domHashNotFound"); return; }

      gSearchDbDomRes = data;
      myEmitter.emit("domHashFound", data[0]);
    });
};


var execCommand = function (_userId, _userUrl, _crudFunction) {
  console.log('execCommand');

  var resultRating = InitResult();

  var cmd = jsunpacknScript + _userId + " " + _userUrl;

  console.log(cmd);

  var child = exec( cmd, function (error, stdout, stderr) {
    if (error !== null) {
      console.log("execCommand - Error: " + error);
      resultRating.error = error;
    }
    else {
      resultRating = processResult(stdout, _userId, resultRating);
    }
    myEmitter.emit("cmdExecuted", resultRating, _crudFunction);
    return;
  });  
};


router.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });



var gUrlHash = null;
var gDomHash = null;

var generateHashes = function (_userUrl) {
  gUrlHash = crypto.createHash('md5').update(_userUrl).digest('hex');

  request(_userUrl, function (error, response, body) {
    if (!error && response.statusCode == 200)
      gDomHash = crypto.createHash('md5').update(body).digest('hex');
    else
      gDomHash = null;

    myEmitter.emit("hashesGenerated");
  });
};

var myEmitter = null;

/* POST entry of single user */
router.post('/', function (req, res, next) {
  myEmitter = new EventEmitter;
  var gSearchDbUrlRes = null;
  var gSearchDbDomRes = null;


  var _userUrl = req.body.url;
  var _userId = req.body.userID;

  myEmitter.on("hashesGenerated", function () {
    console.log('hashesGenerated');
    checkUrlHash(_userUrl);
  });

  myEmitter.on("urlHashFound", function () {
    console.log('urlHashFound');

    checkGdomHash();
  });

  myEmitter.on("domHashFound", function (entry) {
    console.log('domHashFound');

    var resultRating = InitResult(entry.malicious, entry.suspicious, entry.not_detected, 0);
    myEmitter.emit("returnResult", resultRating);
  });

  myEmitter.on("domHashNotFound", function () {
    console.log('domHashNotFound');

    execCommand(_userId, _userUrl, 'update');
  });

  myEmitter.on("urlHashNotFound", function () {
    console.log('urlHashNotFound');

    execCommand(_userId, _userUrl, 'create');
  });

  myEmitter.on("cmdExecuted", function (resultRating, _crudFunction) {
    console.log('cmdExecuted');

    if (resultRating.malicious > 0 || resultRating.suspicious > 0 || resultRating.not_detected > 0)
      dbFunctionDictionary[_crudFunction]({
        malicious : resultRating.malicious,
        suspicious : resultRating.suspicious,
        not_detected : resultRating.not_detected,
        userId : _userId,
        urlHash : gUrlHash,
        domHash : gDomHash
      });

    return;
    // res.json(_result);
  });


  myEmitter.on("returnResult", function (_resultRating) {
    console.log('returnResult');
    res.json(_resultRating);
    // res = null;
    return;
    // next();
  });


  myEmitter.on("returnError", function (_err) {
    console.log("returnError", _err);

    var resultRating = InitResult();
    resultRating.error = _err;
    res.json(resultRating);
    // res=null;
    // next();
    return;
  });


  // res.json(InitResult());

    generateHashes(_userUrl);



});


/*router.get('/', function (req, res, next) {
  myEmitter.on("returnError", function (_err) {
    console.log("OnError", _err);
    
    var resultRating = InitResult();
    resultRating.error = _err;
    res.json(resultRating);
    return;
  });

  dbFunctionDictionary['create']({
        malicious : 4,
        userID : 1233,
        urlHash : '123asd123sad1243ads',
        domHash : 'gDomHash'});
/*setTimeout(function () {
  dbFunctionDictionary['update']({
        malicious : false,
        userID : 1233,
        urlHash : '123asd123sad1243ads',
        domHash : 'asdasdad'});
}, 1000);
});*/

module.exports = router;