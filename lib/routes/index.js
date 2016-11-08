// Load the page
// NB: This needs to be the last route added
exports.serveIndex = function (app, staticFolder) {
  app.get('/',function(req,res){
    res.sendFile("/home/robot/videotrans/index.html");   
      console.log('new connection'); 
  });
  app.get('/save-image',function(req,res){
    require('./socket').saveImage();
    res.send('save-now');
    console.log('save-now');
  });
};