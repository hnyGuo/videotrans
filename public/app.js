(function($){
	"use strict";

	var ws = null;
	var canvas = document.getElementById('rgb-video');
	var context = canvas.getContext('2d');
	var image = null;
	var imageEle = "<div id=\"##id\" class=\"captured-frame\"><img class=\"frame-image\" src=\"##src\" /><div class=\"frame-title\"><a href=\"##href\" download=\"##title\">##title</a></div></div>";

	$("#pause").hide();

	// show loading notice
	context.fillStyle = '#333';
	context.fillText('Loading...', canvas.width/2-30, canvas.height/2);

	function drawFrame(image){
		var img = new Image();
		img.onload = function(){
			context.drawImage(this, 0, 0, canvas.width, canvas.height);
		}
		img.src = image;
	}

	function closeCamera(){
		$("#play").show();
		$("#pause").hide();
		ws.send("close");
	};

	function openCamera(){
		ws = new WebSocket("ws://" + window.location.host.split(":")[0] + ":8088")
		var sizeReceived = false;
        ws.onopen = function () {
            ws.send("open");
        };

        ws.onerror = function (e) {
            console.log(e);
        };

        ws.onmessage = function (message) {
            var data = JSON.parse(message.data);
            switch (data.type) {
            case "size":
                //adjustSize(data.width, data.height);
                break;
            case "frame":
                if (!sizeReceived) {
                    sizeReceived = true;
                    ws.send("size");
                }
                image = "data:image/jpg;base64," + data.frame;
                drawFrame(image);
                break;

            }
        };
        $("#play").hide();
        $("#pause").show();
	};

	function capture() {
        var cap = document.getElementById("acapture");
        cap.href = image;
        cap.download = "" + new Date().getTime() + ".jpg";
        $("#acapture").click();
        var id = "" + new Date().getTime();
        var capImage = imageEle.replace("##id", id).replace("##src", image).replace("##href", image).replace(/##title/g, "" + id + ".jpg");
        $("#captures").prepend(capImage);
    };

	$("#play").click(function(){
		openCamera();
	});
	$("#pause").click(function(){
		closeCamera();
	});

	$('#save-image').click(function(){
		//$.get("http://58.196.142.132:8080/save-image",function(data,status){
		//	alert("data:"+data+"\nstatus:"+status);
		//});
		capture();
	});
	
})(jQuery);


