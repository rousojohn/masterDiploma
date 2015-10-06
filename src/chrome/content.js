/* Listen for messages */
// chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
//      If the received message has the expected format... 
//     if (msg.text && (msg.text == "report_back")) {
//          Call the specified callback, passing 
//            the web-pages DOM content as argument 

//         console.log(window.location.href);
//         console.log(document.URL);
        
//         sendResponse(window.location.href);
        
//     }
// });



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	console.log(request);
	if (request.message === "clicked_browser_action") {
		console.log(document.URL);
	}
});


// chrome.tabs.query({
//             'active': true,
//             'windowId': chrome.windows.WINDOW_ID_CURRENT
//         }, function (tabs) {
//         	console.log(tabs);
//             // chrome.tabs.create({
//             //     url: 'http://www.mydestination.com/index.php?url=' + tabs[0].url
//             // });
//         });