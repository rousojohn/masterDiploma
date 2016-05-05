/* Regex-pattern to check URLs against. 
   It matches URLs like: http[s]://[...]stackoverflow.com[...] */
var urlRegex = /^https?:\/\/(?:[^\.]+\.)?/;
var $ = jQuery;
var thisUserID = '';

var attachedTabs = {};
var version = "1.0";


var getRandomToken = function () {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex;
};

var informUser = function (rating) {
    console.log("informUser: " + rating);
    var text = '';
    var color = '';
    var icon = '' ;
    switch (rating) {
        case 'malicious' :
            color = '#dd0d0d';
            icon = 'Ninja-icon-red.png';
            text = 'Malicious';
            break;
        case 'suspicious' :
            color = '#f3f716';
            icon = 'Ninja-icon-yellow.png';

            text = 'Suspicious';
            break;
        case 'not_detected' :
            icon = 'Ninja-icon.png';

            color = '#99dbd6';
            text = 'Clear';
            break;
        default:
            icon = 'Ninja-icon-white.png';

            color = '#dc00ff';
            text = 'N/A';
            break;
    };

    chrome.browserAction.setIcon({tabId: currentTabID, path: icon});
};

var handleRating = function (rating) {
    console.log("handleRating: " + rating);
    if (rating.malicious > 0)
        return 'malicious';
    else if (rating.suspicious > 0)
        return 'suspicious';
    else if (rating.not_detected > 0)
        return 'not_detected';
    else return '';
};

var sendToServer = function (_url, _debuggeeId, _tabId) {
    if ( urlRegex.test(_url) )
    {
        console.log('sendToServer',_url);
        $.post('http://localhost:3000/entries', { url : _url, userID : thisUserID})
         .done(function (_res) {
            informUser(handleRating(_res));
            console.log(_res);
            if (attachedTabs[_tabId])
             chrome.debugger.detach(_debuggeeId, onDetach.bind(null, _debuggeeId));
        })
         .fail(function (_err) {
            console.log("FAIL");
        });
     }
};


var getCurrentTab = function () {
    console.log('getCurrentTab');
    chrome.tabs.query({active : true, currentWindow: true}, function (tabs) {
        console.log(tabs);
        var activeTab = tabs[0];
    });
};

var currentTabID = null;
var getTabById = function (_tabId) {
    console.log('getTabById', _tabId);
    var debuggeeId = {tabId:_tabId};

    if (attachedTabs[_tabId] == "pausing")
        return;

    if (!attachedTabs[_tabId])
        chrome.debugger.attach(debuggeeId, version, onAttach.bind(null, debuggeeId));

     chrome.tabs.get(_tabId, function(tab) {
        currentTabID = _tabId;
        sendToServer(tab.url, debuggeeId, _tabId);
    });
};



chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){
    console.log("Updated", tabId, changeInfo, tab);
    getTabById(tabId);
});


chrome.tabs.onActivated.addListener(function(info) {
    console.log("Activated", info);
    getTabById(info.tabId);
});

chrome.storage.sync.get('userid', function(items) {
    var userid = items.userid;
    var useToken = function (userid) {
        thisUserID = userid;
    };

    if (userid) {
        useToken(userid);
    } else {
        userid = getRandomToken();
        chrome.storage.sync.set({userid: userid}, function() {
            useToken(userid);
        });
    }
});


chrome.debugger.onEvent.addListener(onEvent);
chrome.debugger.onDetach.addListener(onDetach);

function onAttach(debuggeeId) {
  if (chrome.runtime.lastError) {
    alert(chrome.runtime.lastError.message);
    return;
  }

  var tabId = debuggeeId.tabId;

  attachedTabs[tabId] = "pausing";
  chrome.debugger.sendCommand(
      debuggeeId, "Debugger.enable", {},
      onDebuggerEnabled.bind(null, debuggeeId));
}

function onDebuggerEnabled(debuggeeId) {
  chrome.debugger.sendCommand(debuggeeId, "Debugger.pause");
}

function onEvent(debuggeeId, method) {
  var tabId = debuggeeId.tabId;
  if (method == "Debugger.paused") {
    attachedTabs[tabId] = "paused";
    }
}

function onDetach(debuggeeId) {
  var tabId = debuggeeId.tabId;
  delete attachedTabs[tabId];
}