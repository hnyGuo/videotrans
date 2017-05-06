(function($){
	"use strict";

	var ws = null;
	var ws1 = null;
	var canvas = $('#rgb-video')[0];
	var canvas1 = $('#inf-video')[0];
	var context = canvas.getContext('2d');
	var context1 = canvas1.getContext('2d');
	var image = null;
	var image1 = null;
	var imageUpload = null;
	var imageId = null;
	var imageClass = null;
	var imageEle = "<div id=\"captures\" class=\"thumbnail\" style=\"border-radius:10px;padding:0px;margin-bottom:10px\"><img class=\"frame-image\" src=\"##src\" style=\"margin:10px auto 10px\"><div class=\"frame-title\"><a href=\"##href\" download=\"##title\">##title</a></div></div>";
	var imageRes ="<div class=\"col-sm-6 col-md-3\"><div class=\"thumbnail\"><img src=\"##id\"><div class=\"frame-title\"><a href=\"##href\" download=\"##title\">##title</a></div></div></div>";

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

	function drawFrame1(image){
		var img = new Image();
		img.onload = function(){
			context1.drawImage(this,0,0,canvas1.width,canvas1.height);
		}
		img.src = image;
	}
	function closeCamera(){
		$("#play").show();
		$("#pause").hide();
		ws.send("close");
		ws1.send("close");
	};

	function openCamera(){
		ws = new WebSocket("ws://" + window.location.host.split(":")[0] + ":8088");
		ws1 = new WebSocket("ws://" + window.location.host.split(":")[0] + ":8089");
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

        ws1.onopen = function () {
            ws1.send("open");
        };

        ws1.onerror = function (e) {
            console.log(e);
        };

        ws1.onmessage = function(message){
        	var data = JSON.parse(message.data);
        	switch(data.type){
        	case "size":
        		break;
        	case "frame":
        		image1 = "data:image/jpg;base64," + data.frame;
        		drawFrame1(image1);
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
		if(image != null){
			capture();
		}
	});

	$('#upload').click(function(){
		if (imageUpload != null){
			imageClass=$('#image-class input:radio:checked').val();
			console.log('The image class is: ',imageClass);
			if(imageClass!= undefined){
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
				console.log('Please class the image first!');
			}
		}
		else{
			console.log("You have not opened Camera or taken a photo!");
		}
	});	

	$('#search').click(function(){
		var searchClass=$('#image-class-for-search input:radio:checked').val();
		console.log("Waiting for search:",searchClass);
		if(searchClass!= undefined){
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
					$('#search-result').empty();
					console.log('The number of search result is: ',result.length);
					for(var i=0;i<result.length;i++){
						//console.log(result[i].image_id);
						var id = "./upload/"+result[i].image_id+".jpg";
						var searchImage = imageRes.replace("##id", id).replace("##href",id).replace(/##title/g, "" + result[i].image_id + ".jpg");
						$("#search-result").prepend(searchImage);
					}
					console.log('Search done!');
				},
				error:function(error){
					console.log("Bad search!");
				}
			});
		}
		else{
			console.log('Please choose the search condition first!')
		}
	});

	$('#wifi').click(function(){
		$.ajax({
			url:"http://"+window.location.host.split(":")[0]+":8080/wifi",
			type:"GET",
			success:function(result){
				console.log(result);
			},
			error:function(error){
				console.log("No wifi signal!");
			}
		})
	})
})(jQuery);