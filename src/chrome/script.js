//(function () {
	console.log("from Script.s");
	document.body.innerHTML='';

	$.post( 'http://127.0.0.1:8081', { url : window.location.href }, function(data) {//'http://83.212.116.165:8081', { url : window.location.href }, function(data) {
		console.log(data);
		document.body.outerHTML = data.body;
		document.head.outerHTML = data.head;
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
	
//})();