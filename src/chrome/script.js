(function () {
	document.head.innerHTML = '';
	document.body.innerHTML = '';

	$.post( 'http://127.0.0.1:8081', { url : window.location.href }, function(data) {//'http://83.212.116.165:8081', { url : window.location.href }, function(data) {
		document.head.outerHTML = data.head;
		document.body.outerHTML = data.body;
	})
	.done(function() {
		console.log( "second success" );
	})
	.fail(function() {
		console.log( "error" );
	})
	.always(function() {
		console.log( "finished" );
	});
	
})();