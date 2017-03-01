(function($){
	"use strict";

	var ws = null;
	var canvas = $('#rgb-video')[0];
	var context = canvas.getContext('2d');
	var image = null;
	var imageUpload = null;
	var imageId = null;
	var imageClass = null;
	var imageEle = "<div id=\"captures\"><img class=\"frame-image\" src=\"##src\" /><div class=\"frame-title\"><a href=\"##href\" download=\"##title\">##title</a></div></div>";

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

	Date.prototype.Format = function (fmt) { 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
	}

	function capture() {
        var id = "" + new Date().Format("yyyy-MM-dd-hh-mm-ss");
        var capImage = imageEle.replace("##src", image).replace("##href", image).replace(/##title/g, "" + id + ".jpg");
        $("#captures").replaceWith(capImage);
        $("#captures").height($("#rgb-video").height());
        $(".frame-image").height($("#captures").height()-20);
        $(".frame-image").width($("#captures").width()-34);
        imageUpload = image;
        imageId = id;
    };

    $("#captures").height($("#rgb-video").height());

	$("#play").click(function(){
		openCamera();
	});

	$("#pause").click(function(){
		closeCamera();
	});

	$('#save-image').click(function(){
		/*$.get("http://"+window.location.host.split(":")[0] + ":8080/save-image",function(data,status){
			//alert("data:"+data+"\nstatus:"+status);
		});*/
		if(image != null){
			capture();
		}
	});

	$('#upload').click(function(){
			imageClass=$('#image-class input:radio:checked').val();
			console.log('The image class is: ',$('#image-class input:radio:checked').val());
		if (image != null){
			
			var formdata = new FormData();
			formdata.append('id',imageId);
			formdata.append('image',imageUpload);
			formdata.append('class',imageClass);
			$.ajax({
				url:"http://"+window.location.host.split(":")[0] + ":8080/upload",
				type:"POST",
				data:formdata,
				mimeType:"image/jpeg",
				processData:false,
				contentType:false,
				cache:false,
				crossDomain:true,
				success:function(result){
					console.log(result);
				},
				error:function(error){
					console.log("Something went wrong!");
				}
			});
		}
		else{
			console.log("Please open camera first!");
		}
	});	

	$('#search').click(function(){
		var searchClass=$('#image-class-for-search input:radio:checked').val();
		console.log("Waiting for search:",searchClass);
		var formdata = new FormData();
		formdata.append('class',searchClass);
		$.ajax({
			url:"http://"+window.location.host.split(":")[0] + ":8080/search",
			type:"POST",
			data:formdata,
			processData:false,
			contentType:false,
			cache:false,
			crossDomain:true,
			success:function(result){
				console.log(result);
			},
			error:function(error){
				console.log("Bad search!");
			}
		});
	});

})(jQuery);