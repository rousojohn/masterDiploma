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
    switch (rating) {
        case 'malicious' :
            // alert('Beware malicious Site');
            text = 'Malicious';
            break;
        case 'suspicious' :
            text = 'Suspicious';
            // alert('Continue with caution, suspicious site');
            break;
        case 'not_detected' :
            text = 'Clear';
            // alert('Site Clear');
            break;
        default:
            text = 'Not Analyzed';
            break;
    };

    chrome.browserAction.setBadgeText({text: text});
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

var sendToServer = function (_url) {
    if ( urlRegex.test(_url) )
    {
    console.log('sendToServer',_url);
        $.post('http://localhost:3000/entries', { url : _url, userID : thisUserID})
         .done(function (_res) {
            informUser(handleRating(_res));
            console.log(_res);
        })
         .fail(function (_err) {
            console.log("FAIL");
        });
     }
    // console.log('Send To Server: ', {'_url' : _url, 'userId' : thisUserID});    
};


var getCurrentTab = function () {
    console.log('getCurrentTab');
    chrome.tabs.query({active : true, currentWindow: true}, function (tabs) {
        console.log(tabs);
        var activeTab = tabs[0];
        console.log(activeTab.url);
    });
};

var getTabById = function (_tabId) {
    console.log('getTabById', _tabId)
     chrome.tabs.get(_tabId, function(tab) {
        sendToServer(tab.url);
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

/* When the browser-action button is clicked... */
// chrome.browserAction.onClicked.addListener(function(tab) {
//     /*...check the URL of the active tab against our pattern and... */
//     if (urlRegex.test(tab.url)) {
//         /* ...if it matches, send a message specifying a callback too */
//         chrome.tabs.sendMessage(tab.id, { text: "report_back" }, sendToServer);
//     }
// //    console.log('tstsadsd');
// //    chrome.tabs.executeScript(tab.id, {
// //        code: "window.stop();",
// //        runAt: "document_start"
// //    });
// });





// chrome.debugger.onEvent.addListener(onEvent);
// chrome.debugger.onDetach.addListener(onDetach);

chrome.browserAction.onClicked.addListener(function(tab) {
    getTabById(tab.id);
});

function onAttach(debuggeeId) {
    if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError.message);
        return;
    }
    
    var tabId = debuggeeId.tabId;

    chrome.browserAction.setIcon({tabId: tabId, path:"debuggerPausing.png"});
    chrome.browserAction.setTitle({tabId: tabId, title:"Pausing JavaScript"});
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
        chrome.browserAction.setIcon({tabId:tabId, path:"debuggerContinue.png"});
        chrome.browserAction.setTitle({tabId:tabId, title:"Resume JavaScript"});
    }
}

function onDetach(debuggeeId) {
    var tabId = debuggeeId.tabId;
    delete attachedTabs[tabId];
    chrome.browserAction.setIcon({tabId:tabId, path:"debuggerPause.png"});
    chrome.browserAction.setTitle({tabId:tabId, title:"Pause JavaScript"});
}

