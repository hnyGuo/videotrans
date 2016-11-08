(function($){
	"use strict";

	// MODIFY THIS TO THE APPROPRIATE URL IF IT IS NOT BEING RUN LOCALLY
	var socket = io.connect('http://localhost');

	var canvas = document.getElementById('rgb-video');
	var context = canvas.getContext('2d');
	var img = new Image();

	// show loading notice
	context.fillStyle = '#333';
	context.fillText('Loading...', canvas.width/2-30, canvas.height/2);

	socket.on('frame', function (data) {
	  // Reference: http://stackoverflow.com/questions/24107378/socket-io-began-to-support-binary-stream-from-1-0-is-there-a-complete-example-e/24124966#24124966
		var uint8Arr = new Uint8Array(data.buffer);
		var str = String.fromCharCode.apply(null, uint8Arr);
		var base64String = btoa(str);

		img.onload = function () {
	    context.drawImage(this, 0, 0, canvas.width, canvas.height);
		};
		img.src = 'data:image/png;base64,' + base64String;
	});

	$('#save-image').click(function(){
		$.get("http://localhost:8080/save-image",function(data,status){
			alert("data:"+data+"\nstatus:"+status);
		});
	});
	
})(jQuery);


