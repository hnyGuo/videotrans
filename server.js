// modules
var express = require('express')
  , http = require('http')
  , morgan = require('morgan')
  , WebSocketServer = require("ws").Server
  , cam = require("./build/Release/camera.node")
  , fs = require("fs")
  , websocketPort = 8088
  , webPort = 8080
  , openBrowser = false
  , width = 320
  , height = 240
  , inputString = "0"
  ;

var wss = new WebSocketServer({
    port: websocketPort
});

var clients = {};

var frameCallback = function (image){
	var frame = {
		type: "frame",
		frame: new Buffer(image, "ascii").toString("base64")
	};
	var raw = JSON.stringify(frame);
	for (var index in clients){
		clients[index].send(raw);
	}
};

var disconnectClient = function (index) {
	if (Object.keys(clients).length > 0){
    delete clients[index];
  }
  if (Object.keys(clients).length == 0){
		console.log("No Clients, Closing Camera");
		cam.Close();
	}
};

var connectClient = function (ws){
	var index = ""+ new Date().getTime();
	console.log(cam.IsOpen());
	if(!cam.IsOpen()){
		console.log("New Clients, Opening Camera");
		cam.Open(frameCallback,{
			width:width,
			height:height,
			window:false,
			codec:".jpg",
			input:inputString
		});
	}
	clients[index] = ws;
	return index;
};

wss.on('connection', function (ws) {
    var disconnected = false;
    var index = connectClient(ws);

    ws.on('close', function () {
        disconnectClient(index);
    });

    ws.on('open', function () {
        console.log("Opened");
    });

    ws.on('message', function (message) {

        switch (message) {
        case "close":
            {
                disconnectClient(index);
            }
            break;
        case "size":
            {
                var size = cam.GetPreviewSize();

                ws.send(JSON.stringify({
                    type: "size",
                    width: size.width,
                    height: size.height
                }));
            }
            break;
        }
    });

});

// app parameters
var app = express();
app.set('port', webPort);
app.use(express.static('public'));
app.use(morgan('dev'));

app.get('/',function(req,res){
    res.sendFile("/home/robot/videotrans/index.html");   
      console.log('new connection'); 
  });

/*app.get('/save-image',function(req,res){
	require('./socket').saveImage();
	res.send('save-success');
	console.log('save-image');
});*/

// HTTP server
var server = http.createServer(app);
server.listen(app.get('port'), function () {
  console.log('HTTP server listening on port ' + app.get('port'));
});

/*if (openBrowser) {
    var spawn = require('child_process').spawn
    spawn('open', ['http://58.196.142.132:' + webPort]);
}*/

module.exports.app = app;