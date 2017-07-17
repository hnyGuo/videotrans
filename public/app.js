(function($){
	"use strict";

	var ws = null;
	var ws1 = null;
	var canvas = $('#rgb_video')[0];
	var canvas_large = $('#rgb_video_large')[0];
	var canvas1 = $('#inf_video')[0];
	var canvas1_large = $('#inf_video_large')[0];
	var context = canvas.getContext('2d');
	var context_large = canvas_large.getContext('2d');
	var context1 = canvas1.getContext('2d');
	var context1_large = canvas1_large.getContext('2d');
	var image = null;
	var image1 = null;
	var imageUpload = null;
	var imageUpload1=null;
	var rgbImageId = null;
	var infraImageId = null;
	var imageClass = null;
	var imageEle = "<div id=\"captures\" class=\"thumbnail\" style=\"border-radius:10px;padding:0px;margin-bottom:5px\"><img class=\"frame-image\" src=\"##src\" style=\"margin:10px auto 0px\"><div class=\"frame-title\"><a href=\"##href\" download=\"##title\">##title</a></div></div>";
	var imageRes ="<div class=\"col-sm-6 col-md-3\"><div class=\"thumbnail\"><img src=\"##id\" style=\"width:202px;height:151.5px;margin-bottom:1px\"><div class=\"frame-title\"><a href=\"##href\" download=\"##title\">##title</a></div></div></div>";
	var wifiEle = "<div class=\"row\"><img src=\"##src\" style=\"height:30px;width:30px;margin:10px 30px 10px 10px\" align=\"left\"><p style=\"margin:12px 10px 8px 10px\" align=\"left\">##ssid</p></div>";
	$("#pause").hide();
	$("audio").hide();

	// show loading notice
	context.fillStyle = '#333';
	context.fillText('Loading...', canvas.width/2-30, canvas.height/2);

	function drawFrame(image){
		var img = new Image();
		img.onload = function(){
			context.drawImage(this, 0, 0, canvas.width, canvas.height);
			context_large.drawImage(this,0,0,canvas_large.width,canvas_large.height);
		}
		img.src = image;
	}

	function drawFrame1(image){
		var img = new Image();
		img.onload = function(){
			context1.drawImage(this,0,0,canvas1.width,canvas1.height);
			context1_large.drawImage(this,0,0,canvas1_large.width,canvas1_large.height);
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
        	var audio=document.getElementById("audio");
        	switch(data.type){
        	case "size":
        	audio.pause();
        		break;
        	case "frame":
        	//audio.pause();
        		image1 = "data:image/jpg;base64," + data.frame;
        		drawFrame1(image1);
        		break;
        	case "warning":
        		//console.log(data.temperature);
        		audio.play();
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
        var rgb_id = "" + new Date().Format("yyyy-MM-dd-hh-mm-ss")+"-1";
        var infra_id = "" + new Date().Format("yyyy-MM-dd-hh-mm-ss")+"-2";
        var capImage = imageEle.replace("##src", image).replace("##href", image).replace(/##title/g, "" + rgb_id + ".jpg");
        $("#captures").replaceWith(capImage);
        $("#captures").height($("#rgb_video").height());
        $(".frame-image").height($("#captures").height()-30);
        console.log($("#rgb_video").height());
        console.log($("#captures").height());
        console.log($(".frame-image").height());
        $(".frame-image").width($("#captures").width()-34);
        imageUpload = image;
        imageUpload1 = image1;
        rgbImageId = rgb_id;
        infraImageId = infra_id;
    };

    $("#captures").height($("#rgb_video").height());

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
				formdata.append('rgbId',rgbImageId);
				formdata.append('infraId',infraImageId);
				formdata.append('rgbImage',imageUpload);
				formdata.append('infraImage',imageUpload1);
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
						//alert(result);
						$('#upload-result').empty();
						$('#upload-result').append(result);
						$('#myModal4').modal('show');
					},
					error:function(error){
						console.log("Something went wrong!");
						alert(error);
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
		var searchClass=$('#image-class input:radio:checked').val();
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
					//console.log(result);
					for(var i=0;i<result.length;i++){
						//console.log(result[i].image_id);
						var id = "./upload/"+result[i].rgb_image_id+".jpg";
						var searchImage = imageRes.replace("##id", id).replace("##href",id).replace(/##title/g, "" + result[i].rgb_image_id + ".jpg");
						$('#search-result').append(searchImage);
						id = "./upload/"+result[i].infra_image_id+".jpg";
						searchImage = imageRes.replace("##id", id).replace("##href",id).replace(/##title/g, "" + result[i].infra_image_id + ".jpg");
						$('#search-result').append(searchImage);
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
				$('#wifi-list').empty();
				for(var i=0;i<result.length;i++){
					if(result[i]!=undefined){
						//console.log(result[i].signalQuality/25);
						if(result[i].signalQuality/25<1){
							var wifi = wifiEle.replace("##src","images/wifi1.jpg").replace("##ssid",result[i].ssid);
						}
						else if(result[i].signalQuality/25>=1&&result[i].signalQuality/25<2){
							var wifi = wifiEle.replace("##src","images/wifi2.jpg").replace("##ssid",result[i].ssid);	
						}
						else if(result[i].signalQuality/25>=2&&result[i].signalQuality/25<3){
							var wifi = wifiEle.replace("##src","images/wifi3.jpg").replace("##ssid",result[i].ssid);	
						}
						else{
							var wifi = wifiEle.replace("##src","images/wifi4.jpg").replace("##ssid",result[i].ssid);	
						}
						$('#wifi-list').append(wifi);
					}
				}
			},
			error:function(error){
				console.log("No wifi signal!");
			}
		})
	})

	$( window ).resize(function() {
  		$("#captures").height($("#rgb_video").height());
  		$(".frame-image").height($("#captures").height()-30);
        //console.log($("#rgb_video").height());
        //console.log($("#captures").height());
        //console.log($(".frame-image").height());
        $(".frame-image").width($("#captures").width()-34);
	});


})(jQuery);