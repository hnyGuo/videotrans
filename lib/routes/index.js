// Load the page
// NB: This needs to be the last route added
exports.serveIndex = function (app, staticFolder) {
  app.get('*', function (req, res) {
    res.sendFile('index.html', { root: staticFolder });
  });  //make no difference
  app.get('/',function(req,res){
	res.send('Hello world');
	console.log('save-now');  	
  });
  app.get('/save-image',function(req,res){
  	res.send('save-now');
	console.log('save-now');  	
  });
};