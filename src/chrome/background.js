(function () {
	console.log("Form BackgroundScript");
	
	var injectScript = function (_tabId) {
		console.log("injection Called", _tabId);
		chrome.tabs.executeScript(_tabId, { file: "contentscript.js" }, function() {
			console.log("injection Callback");
			return;
		});
	};

	chrome.browserAction.onClicked.addListener(function (tab) {
		console.log("Action Clicked");
		injectScript(tab.Id)
	});

	chrome.tabs.onUpdated.addListener(function(tabId,changeInfo,tab){
		if (tab.status === "loading" && changeInfo.status !== undefined && changeInfo.status === "loading" ) {
			if ( tab.url !== undefined && !tab.url.startsWith("chrome://") ){
				console.log("onUpdated", tabId, changeInfo, tab);
				injectScript(tabId);
			}
		}
	});
})();