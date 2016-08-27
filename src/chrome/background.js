(function () {
	console.log("Form BackgroundScript");
	
	var injectScript = function (_tabId) {
		console.log("injection Called", _tabId);
		chrome.tabs.executeScript(_tabId, { file: "contentscript.js" }, function() {
			console.log("injection Callback");
			return;
		});
	};
	
	/*chrome.webNavigation.onCommitted.addListener(function(info) {
		if (info.frameId === 0) {
			console.log("chrome.webNavigation.onCommitted", info);
		//	injectScript(info.tabId);
		}
	});*/

	chrome.browserAction.onClicked.addListener(function (tab) {
		console.log("Action Clicked");
		injectScript(tab.Id)
	});


	chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){
		if (tab.status === "loading" && changeInfo.status !== undefined && changeInfo.status === "loading" ) {
			if ( tab.url !== undefined && !tab.url.startsWith("chrome://") )
				console.log("onUpdated", tabId, changeInfo, tab);
			injectScript(tabId);
		}
	});
/*
	chrome.tabs.onActivated.addListener(function(info) {
		console.log("onActivated", info);	
		//injectScript(info.tabId);
	});*/
})();