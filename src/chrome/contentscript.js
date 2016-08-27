(function () {
console.log('From ContentScript');
	var ss = document.createElement('script');
	ss.src = chrome.extension.getURL('jquery-3.0.0.min.js');
	(document.head||document.documentElement).appendChild(ss);


	var s = document.createElement('script');
	s.src = chrome.extension.getURL('script.js');
	(document.head||document.documentElement).appendChild(s);
	
	console.log('Exit ContentSctipt');
})();