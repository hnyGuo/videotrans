// modules
var express = require('express')
  , http = require('http')
  , morgan = require('morgan')
  , WebSocketServer = require('ws').Server
  , cam = require('./build/Release/camera')
  , infra = require('./build/Release/infrared')
  , wifi = require('./build/Release/wifi')
  , fs = require('fs')
  , multer = require('multer')
  , query = require('./query.js')
  , websocketPort = 8088
  , websocketPort1 = 8089
  , webPort = 8080
  , openBrowser = false
  , width = 320
  , height = 240
  , inputIndex = 2    //Camera Index
  , threshold = 15
  ;

var wss = new WebSocketServer({
    port: websocketPort
});

var wss1=new WebSocketServer({
  port: websocketPort1
})

var clients = {};
var clients1 ={};

var createFolder = function(folder){
  try{
    fs.accessSync(folder);
  }catch(e){
    fs.mkdirSync(folder);
  }
};

var uploadFolder = './upload';
createFolder(uploadFolder);

var storage = multer.diskStorage({
  destination:function(req,file,cb){
    cb(null,uploadFolder);
  },
  filename:function(req,file,cb){
    cb(null,file.originalname);
  }
});

var upload = multer({storage:storage});

var frameCallback = function (image){
	var frame = {
		type: "frame",
		frame: new Buffer(image, "ascii").toString("base64")
	};
	var raw = JSON.stringify(frame);
	for (var index in clients){
		clients[index].send(raw,function(err){
      //console.log("err:",err);
    });
	}
};

var frameCallback1 = function(image,temp){
  var frame = {
    type: "frame",
    frame: new Buffer(image,"ascii").toString("base64")
  };
  var raw = JSON.stringify(frame);
  for (var index in clients1){
    clients1[index].send(raw,function(err){
      //console.log("err:",err);
    });
  }
  if ( temp.temperature > threshold){
    for(var index in clients1){
      clients1[index].send(JSON.stringify({
                    type: "warning",
                    temperature: temp.temperature,
                }),function(err){
        //console.log("err:",err);
      });  
    }
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

var disconnectClient1 = function(index){
  if (Object.keys(clients1).length > 0){
    delete clients1[index];
  }
  if(Object.keys(clients1).length == 0){
    console.log("No Clients, Closing Infrared Camera");
    infra.Close();
  }
}
var connectClient = function (ws){
	var index = ""+ new Date().getTime();
	console.log(cam.IsOpen());
	if(!cam.IsOpen()){
		console.log("New Clients, Opening Camera");
		console.log(cam.Open(frameCallback,{
			width:width,
			height:height,
			window:false,
			codec:".jpg",
			input:inputIndex
		}));
	}
	clients[index] = ws;
	return index;
};

var connectClient1 = function(ws){
  var index = ""+ new Date().getTime();
  console.log(infra.IsOpen());
  if(!infra.IsOpen()){
    console.log("New Clients, Opening Infrared Camra");
    console.log(infra.Open(frameCallback1));
  }
  clients1[index] = ws;
  return index;
}

wss.on('connection', function (ws) {
    var disconnected = false;
    var index = connectClient(ws);

    ws.on('close', function (err) {
        disconnectClient(index);
        console.log("WebPage Close:",err);
    });

    ws.on('open', function () {
        console.log("Opened");
    });

    ws.on('message', function (message) {

        switch (message) {
        case "close":
            {
                disconnectClient(index);
                console.log('Button Close...')
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

wss1.on('connection', function (ws) {
    var disconnected = false;
    var index = connectClient1(ws);

    ws.on('close', function (err) {
        disconnectClient1(index);
        console.log("WebPage Close:",err);
    });

    ws.on('open', function () {
        console.log("Opened");
    });

    ws.on('message', function (message) {

        switch (message) {
        case "close":
            {
                disconnectClient1(index);
                console.log('Button Close...');
            }
            break;
        case "size":
            {
                var size = infra.GetPreviewSize();
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
    res.sendFile(__dirname+'/index.html');   
    console.log('new connection'); 
});

/*app.get('/save-image',function(req,res){
	query('SELECT * from images',function(err,results,fields){
    console.log(results);
  });
  res.send('success');
});*/

app.post('/upload',upload.single(),function(req,res){
  var rgbImageId = req.body.rgbId;
  var infraImageId = req.body.infraId;
  var imageClass = req.body.class;
  var rgbImageData = req.body.rgbImage;
  var infraImageData = req.body.infraImage;
  var rgbBase64Data = rgbImageData.replace(/^data:image\/\w+;base64,/,"");
  var infraBase64Data = infraImageData.replace(/^data:image\/\w+;base64,/,"");
  var rgbDataBuffer = new Buffer(rgbBase64Data,'base64');
  var infraDataBuffer = new Buffer(infraBase64Data,'base64');
  var post = {
    rgb_image_id : rgbImageId,
    infra_image_id : infraImageId,
    image_class : imageClass 
  };

  query('INSERT INTO images SET ?',post,function(err,results,fields){
    if (err){
      console.log(err.message);
      res.send(err);
    }else{
      console.log('insert success');
      fs.writeFile("./public/upload/"+rgbImageId+".jpg",rgbDataBuffer,function(err){
      if(err){
        res.send(err);
      }else{
        res.send("上传成功!");
      }
      });

      fs.writeFile("./public/upload/"+infraImageId+".jpg",infraDataBuffer,function(err){
      if(err){
        //res.send(err);
      }else{
        //res.send("upload successful!");
      }
      });
    }
  });
});

app.post('/search',upload.single(),function(req,res){
  var searchClass = req.body.class;
  console.log(searchClass);
  var post = {
    image_class : searchClass
  };
  query('SELECT rgb_image_id, infra_image_id FROM images WHERE ?',post,function(err,results,fields){
    if(err){
      console.log(err.message);
      res.send(err);
    }else{
      console.log(results);
      var length = results.length;
      console.log('The number of results is: ',length);
      res.send(results);
    }
  });
});

app.get('/wifi',function(req,res){
  var wifiList = wifi.wifiScan();
  console.log(wifiList);
  res.send(wifiList);
})

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